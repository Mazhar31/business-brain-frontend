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
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const title = formData.get('title') as string || 'Voice Recording'
    
    if (!audioFile) {
      return new Response('No audio file provided', { status: 400, headers: corsHeaders })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Get user's organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    // Upload audio file to storage
    const fileName = `${user.id}/${Date.now()}-${audioFile.name}`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('voice-recordings')
      .upload(fileName, audioFile)

    if (uploadError) {
      throw uploadError
    }

    // Transcribe audio using OpenAI Whisper
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile)
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'en')
    whisperFormData.append('response_format', 'verbose_json')

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: whisperFormData,
    })

    if (!transcriptionResponse.ok) {
      throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`)
    }

    const transcription = await transcriptionResponse.json()
    
    // Create document record
    const { data: document } = await supabaseClient
      .from('documents')
      .insert({
        org_id: profile.org_id,
        user_id: user.id,
        title,
        content: transcription.text,
        file_path: fileName,
        file_type: audioFile.type,
        file_size: audioFile.size,
        metadata: {
          duration: transcription.duration,
          language: transcription.language,
          segments: transcription.segments,
          speaker: 'Voice Recording'
        },
        processing_status: 'completed'
      })
      .select()
      .single()

    // Generate chunks and embeddings for the transcription
    const chunks = chunkText(transcription.text, 1000, 200)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await generateEmbedding(chunk)
      
      await supabaseClient.from('document_chunks').insert({
        document_id: document.id,
        chunk_text: chunk,
        chunk_index: i,
        embedding,
        metadata: {
          word_count: chunk.split(' ').length,
          char_count: chunk.length,
          source: 'voice_recording'
        }
      })
    }

    // Mark embeddings as generated
    await supabaseClient
      .from('documents')
      .update({ embeddings_generated: true })
      .eq('id', document.id)

    // Track analytics
    await supabaseClient.from('analytics_events').insert({
      org_id: profile.org_id,
      user_id: user.id,
      event_type: 'voice_transcribed',
      event_data: { 
        document_id: document.id,
        duration: transcription.duration,
        word_count: transcription.text.split(' ').length,
        chunks_created: chunks.length
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        document_id: document.id,
        transcription: transcription.text,
        duration: transcription.duration,
        chunks_created: chunks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Voice transcription error:', error)
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