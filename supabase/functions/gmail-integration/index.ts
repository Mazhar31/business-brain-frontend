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
    const { action, code, refreshToken } = await req.json()
    
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

    if (action === 'connect') {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-integration`
        })
      })

      const tokens = await tokenResponse.json()

      if (tokens.error) {
        throw new Error(`OAuth error: ${tokens.error_description}`)
      }

      // Save integration
      const { data: integration } = await supabaseClient
        .from('integrations')
        .upsert({
          org_id: profile.org_id,
          user_id: user.id,
          type: 'gmail',
          name: 'Gmail Integration',
          config: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          },
          status: 'connected'
        })
        .select()
        .single()

      return new Response(
        JSON.stringify({ success: true, integration }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'sync') {
      // Get Gmail integration
      const { data: integration } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'gmail')
        .eq('status', 'connected')
        .single()

      if (!integration) {
        return new Response('Gmail not connected', { status: 400, headers: corsHeaders })
      }

      // Check if token needs refresh
      const config = integration.config as any
      const expiresAt = new Date(config.expires_at)
      
      if (expiresAt <= new Date()) {
        // Refresh token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
            refresh_token: config.refresh_token,
            grant_type: 'refresh_token'
          })
        })

        const newTokens = await refreshResponse.json()
        
        // Update integration with new tokens
        await supabaseClient
          .from('integrations')
          .update({
            config: {
              ...config,
              access_token: newTokens.access_token,
              expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
            }
          })
          .eq('id', integration.id)

        config.access_token = newTokens.access_token
      }

      // Search for emails with meeting-related keywords
      const query = 'subject:(meeting OR call OR zoom OR teams OR "video call") OR body:(meeting OR agenda OR "call scheduled")'
      
      const emailsResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
        }
      })

      const emailsData = await emailsResponse.json()
      let processedCount = 0

      if (emailsData.messages) {
        for (const message of emailsData.messages.slice(0, 10)) { // Process latest 10
          try {
            // Get full email content
            const emailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
              headers: {
                'Authorization': `Bearer ${config.access_token}`,
              }
            })

            const emailData = await emailResponse.json()
            
            // Extract email content and metadata
            const subject = emailData.payload.headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject'
            const from = emailData.payload.headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
            const date = emailData.payload.headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString()
            
            let body = ''
            if (emailData.payload.body?.data) {
              body = atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
            } else if (emailData.payload.parts) {
              for (const part of emailData.payload.parts) {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                  body += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                }
              }
            }

            // Check if already processed
            const { data: existingDoc } = await supabaseClient
              .from('documents')
              .select('id')
              .eq('source_url', `gmail:${message.id}`)
              .single()

            if (!existingDoc) {
              // Create document record
              const { data: document } = await supabaseClient
                .from('documents')
                .insert({
                  org_id: profile.org_id,
                  user_id: user.id,
                  title: `Email: ${subject}`,
                  content: `From: ${from}\nSubject: ${subject}\n\n${body}`,
                  source_url: `gmail:${message.id}`,
                  file_type: 'email',
                  metadata: {
                    from,
                    subject,
                    date,
                    message_id: message.id,
                    source: 'gmail'
                  },
                  processing_status: 'completed'
                })
                .select()
                .single()

              // Generate embeddings for email content
              const chunks = chunkText(`${subject} ${body}`, 1000, 200)
              
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
                    source: 'gmail'
                  }
                })
              }

              // Mark embeddings as generated
              await supabaseClient
                .from('documents')
                .update({ embeddings_generated: true })
                .eq('id', document.id)

              processedCount++
            }
          } catch (emailError) {
            console.error('Error processing email:', emailError)
            // Continue with next email
          }
        }
      }

      // Update last sync time
      await supabaseClient
        .from('integrations')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', integration.id)

      // Track analytics
      await supabaseClient.from('analytics_events').insert({
        org_id: profile.org_id,
        user_id: user.id,
        event_type: 'gmail_sync',
        event_data: { 
          emails_processed: processedCount,
          total_emails_found: emailsData.messages?.length || 0
        }
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          emails_processed: processedCount,
          total_found: emailsData.messages?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Invalid action', { status: 400, headers: corsHeaders })

  } catch (error) {
    console.error('Gmail integration error:', error)
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