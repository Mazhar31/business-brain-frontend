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
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || '7d'
    
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

    // Calculate date range based on timeframe
    const now = new Date()
    const timeframeDays = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30
    const startDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000)

    // Get analytics data
    const { data: events } = await supabaseClient
      .from('analytics_events')
      .select('*')
      .eq('org_id', profile.org_id)
      .gte('created_at', startDate.toISOString())

    // Get document stats
    const { data: documents } = await supabaseClient
      .from('documents')
      .select('id, file_type, processing_status, created_at, file_size')
      .eq('org_id', profile.org_id)
      .gte('created_at', startDate.toISOString())

    // Get conversation stats
    const { data: conversations } = await supabaseClient
      .from('conversations')
      .select('id, created_at')
      .eq('org_id', profile.org_id)
      .gte('created_at', startDate.toISOString())

    // Get integration stats
    const { data: integrations } = await supabaseClient
      .from('integrations')
      .select('type, status, last_sync')
      .eq('org_id', profile.org_id)

    // Process analytics data
    const analytics = {
      overview: {
        total_documents: documents?.length || 0,
        total_conversations: conversations?.length || 0,
        total_events: events?.length || 0,
        active_integrations: integrations?.filter(i => i.status === 'connected').length || 0
      },
      
      // Document analytics
      documents: {
        by_type: aggregateByField(documents || [], 'file_type'),
        by_status: aggregateByField(documents || [], 'processing_status'),
        total_size: (documents || []).reduce((sum, doc) => sum + (doc.file_size || 0), 0),
        daily_uploads: aggregateByDay(documents || [], timeframeDays)
      },

      // Chat analytics
      conversations: {
        daily_chats: aggregateByDay(conversations || [], timeframeDays),
        total_messages: events?.filter(e => e.event_type === 'chat_completion').length || 0
      },

      // Event analytics
      events: {
        by_type: aggregateByField(events || [], 'event_type'),
        daily_activity: aggregateByDay(events || [], timeframeDays),
        popular_features: getPopularFeatures(events || [])
      },

      // Integration analytics
      integrations: {
        by_type: aggregateByField(integrations || [], 'type'),
        by_status: aggregateByField(integrations || [], 'status'),
        sync_activity: integrations?.map(i => ({
          type: i.type,
          last_sync: i.last_sync,
          status: i.status
        })) || []
      },

      // Performance metrics
      performance: {
        avg_processing_time: calculateAvgProcessingTime(events || []),
        success_rate: calculateSuccessRate(documents || []),
        user_engagement: calculateEngagement(events || [], timeframeDays)
      }
    }

    // Get Perplexity insights for business intelligence
    if (events && events.length > 0) {
      try {
        const insights = await generateBusinessInsights(analytics, profile.org_id)
        analytics.insights = insights
      } catch (insightError) {
        console.error('Error generating insights:', insightError)
        analytics.insights = { error: 'Unable to generate insights' }
      }
    }

    return new Response(
      JSON.stringify(analytics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function aggregateByField(data: any[], field: string) {
  const counts: Record<string, number> = {}
  data.forEach(item => {
    const value = item[field] || 'unknown'
    counts[value] = (counts[value] || 0) + 1
  })
  return counts
}

function aggregateByDay(data: any[], days: number) {
  const dailyCounts: Record<string, number> = {}
  const now = new Date()
  
  // Initialize all days to 0
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayKey = date.toISOString().split('T')[0]
    dailyCounts[dayKey] = 0
  }
  
  // Count actual data
  data.forEach(item => {
    const date = new Date(item.created_at)
    const dayKey = date.toISOString().split('T')[0]
    if (dailyCounts.hasOwnProperty(dayKey)) {
      dailyCounts[dayKey]++
    }
  })
  
  return dailyCounts
}

function getPopularFeatures(events: any[]) {
  const featureCounts: Record<string, number> = {}
  events.forEach(event => {
    featureCounts[event.event_type] = (featureCounts[event.event_type] || 0) + 1
  })
  
  return Object.entries(featureCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([feature, count]) => ({ feature, count }))
}

function calculateAvgProcessingTime(events: any[]) {
  const processingEvents = events.filter(e => 
    e.event_type === 'document_processed' && 
    e.event_data?.processing_time
  )
  
  if (processingEvents.length === 0) return 0
  
  const totalTime = processingEvents.reduce((sum, e) => 
    sum + (e.event_data.processing_time || 0), 0
  )
  
  return Math.round(totalTime / processingEvents.length)
}

function calculateSuccessRate(documents: any[]) {
  if (documents.length === 0) return 100
  
  const successfulDocs = documents.filter(d => d.processing_status === 'completed').length
  return Math.round((successfulDocs / documents.length) * 100)
}

function calculateEngagement(events: any[], days: number) {
  const uniqueUsers = new Set(events.map(e => e.user_id)).size
  const totalEvents = events.length
  const avgEventsPerDay = Math.round(totalEvents / days)
  
  return {
    unique_users: uniqueUsers,
    total_events: totalEvents,
    avg_events_per_day: avgEventsPerDay,
    engagement_score: Math.min(100, Math.round(avgEventsPerDay * 10))
  }
}

async function generateBusinessInsights(analytics: any, orgId: string) {
  try {
    const prompt = `Based on the following business analytics data, provide 3-5 key insights and recommendations for improving business operations:
    
    Documents: ${analytics.documents.total_documents} total, ${JSON.stringify(analytics.documents.by_type)}
    Conversations: ${analytics.conversations.total_messages} chat interactions
    Popular features: ${JSON.stringify(analytics.events.popular_features)}
    Integration status: ${JSON.stringify(analytics.integrations.by_status)}
    Performance: ${analytics.performance.success_rate}% success rate
    
    Focus on actionable insights for business productivity and knowledge management.`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a business intelligence analyst. Provide concise, actionable insights based on company data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    const result = await response.json()
    return {
      insights: result.choices[0].message.content,
      generated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error generating insights:', error)
    return {
      error: 'Unable to generate insights at this time',
      generated_at: new Date().toISOString()
    }
  }
}