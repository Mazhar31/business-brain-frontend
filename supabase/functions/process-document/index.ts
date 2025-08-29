import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get document details
    const { data: document } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (!document) {
      return new Response('Document not found', { status: 404, headers: corsHeaders })
    }

    // Update processing status
    await supabaseClient
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId)

    let content = ''
    
    try {
      // Extract text based on file type
      if (document.file_type === 'text/plain') {
        // Download file from storage
        const { data: fileData } = await supabaseClient.storage
          .from('documents')
          .download(document.file_path)
        
        if (fileData) {
          content = await fileData.text()
        }
      } else if (document.file_type === 'application/pdf') {
        // For PDFs, we'd need a PDF parsing library
        // This is a simplified version - you'd want to use pdf-parse or similar
        content = document.content || 'PDF content extraction not implemented'
      } else if (document.file_type.startsWith('audio/')) {
        // Transcribe audio using OpenAI Whisper
        const { data: audioData } = await supabaseClient.storage
          .from('documents')
          .download(document.file_path)

        if (audioData) {
          const formData = new FormData()
          formData.append('file', audioData, 'audio.wav')
          formData.append('model', 'whisper-1')

          const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            },
            body: formData,
          })

          const transcription = await transcriptionResponse.json()
          content = transcription.text
        }
      }

      // Update document with extracted content
      await supabaseClient
        .from('documents')
        .update({ content })
        .eq('id', documentId)

      // Chunk the content for vector embeddings
      const chunks = chunkText(content, 1000, 200) // 1000 chars with 200 overlap
      
      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = await generateEmbedding(chunk)
        
        await supabaseClient.from('document_chunks').insert({
          document_id: documentId,
          chunk_text: chunk,
          chunk_index: i,
          embedding,
          metadata: {
            word_count: chunk.split(' ').length,
            char_count: chunk.length
          }
        })
      }

      // Mark as completed
      await supabaseClient
        .from('documents')
        .update({ 
          processing_status: 'completed',
          embeddings_generated: true 
        })
        .eq('id', documentId)

      // Track analytics
      await supabaseClient.from('analytics_events').insert({
        org_id: document.org_id,
        user_id: document.user_id,
        event_type: 'document_processed',
        event_data: { 
          document_id: documentId,
          chunks_created: chunks.length,
          content_length: content.length,
          file_type: document.file_type
        }
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          chunks_created: chunks.length,
          content_length: content.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (processingError) {
      console.error('Processing error:', processingError)
      
      // Mark as failed
      await supabaseClient
        .from('documents')
        .update({ 
          processing_status: 'failed',
          metadata: { 
            ...document.metadata, 
            error: processingError.message 
          }
        })
        .eq('id', documentId)

      throw processingError
    }

  } catch (error) {
    console.error('Document processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start = end - overlap
  }
  
  return chunks
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  })

  const result = await response.json()
  return result.data[0].embedding
}