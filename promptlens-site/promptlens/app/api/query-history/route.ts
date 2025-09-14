import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const queryType = searchParams.get('queryType')
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('query_history')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false })
      .limit(limit)

    if (queryType) {
      query = query.eq('query_type', queryType)
    }

    if (favoritesOnly) {
      query = query.eq('is_favorite', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching query history:', error)
      return NextResponse.json({ error: 'Failed to fetch query history' }, { status: 500 })
    }

    return NextResponse.json({ queries: data || [] })
  } catch (error) {
    console.error('Error in query history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, queryText, queryType = 'natural_language', chartType, tags = [], metadata = {} } = body

    if (!userId || !queryText) {
      return NextResponse.json({ error: 'User ID and query text are required' }, { status: 400 })
    }

    // Check if query already exists
    const { data: existing } = await supabase
      .from('query_history')
      .select('*')
      .eq('user_id', userId)
      .eq('query_text', queryText)
      .single()

    if (existing) {
      // Update usage count and last_used_at
      const { data, error } = await supabase
        .from('query_history')
        .update({
          usage_count: existing.usage_count + 1,
          last_used_at: new Date().toISOString(),
          chart_type: chartType || existing.chart_type,
          tags: tags.length > 0 ? tags : existing.tags,
          metadata: { ...existing.metadata, ...metadata }
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating query history:', error)
        return NextResponse.json({ error: 'Failed to update query history' }, { status: 500 })
      }

      return NextResponse.json({ query: data })
    } else {
      // Create new query history entry
      const { data, error } = await supabase
        .from('query_history')
        .insert({
          user_id: userId,
          query_text: queryText,
          query_type: queryType,
          chart_type: chartType,
          tags,
          metadata
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating query history:', error)
        return NextResponse.json({ error: 'Failed to create query history' }, { status: 500 })
      }

      return NextResponse.json({ query: data })
    }
  } catch (error) {
    console.error('Error in query history POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
