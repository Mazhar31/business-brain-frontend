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
    const { message, conversationId } = await req.json()
    
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

    // Perform vector similarity search on user's documents
    const { data: chunks } = await supabaseClient.rpc('match_documents', {
      query_embedding: await generateEmbedding(message),
      match_threshold: 0.7,
      match_count: 5,
      org_id: profile.org_id
    })

    // Build context from relevant chunks
    const context = chunks?.map((chunk: any) => chunk.content).join('\n\n') || ''

    // Call OpenAI with context
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a knowledgeable business assistant. Use the following context from the company's documents to answer questions accurately. If the context doesn't contain relevant information, say so clearly.

Context:
${context}`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    const completion = await openaiResponse.json()
    const assistantMessage = completion.choices[0].message.content

    // Save conversation and messages
    let conversation
    if (conversationId) {
      conversation = { id: conversationId }
    } else {
      const { data: newConversation } = await supabaseClient
        .from('conversations')
        .insert({
          org_id: profile.org_id,
          user_id: user.id,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single()
      conversation = newConversation
    }

    // Save user message
    await supabaseClient.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      sources: chunks?.map((chunk: any) => ({ 
        document_id: chunk.document_id, 
        title: chunk.title 
      })) || []
    })

    // Save assistant message
    await supabaseClient.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: assistantMessage,
      sources: chunks?.map((chunk: any) => ({ 
        document_id: chunk.document_id, 
        title: chunk.title 
      })) || []
    })

    // Track analytics
    await supabaseClient.from('analytics_events').insert({
      org_id: profile.org_id,
      user_id: user.id,
      event_type: 'chat_completion',
      event_data: { 
        message_length: message.length,
        sources_used: chunks?.length || 0,
        conversation_id: conversation.id
      }
    })

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        conversationId: conversation.id,
        sources: chunks?.map((chunk: any) => ({ 
          document_id: chunk.document_id, 
          title: chunk.title,
          content: chunk.content.substring(0, 200) + '...'
        })) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Chat completion error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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