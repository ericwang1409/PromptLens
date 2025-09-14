import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    const query = supabase
      .from('saved_visualizations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching visualizations:', error)
      return Response.json({ error: 'Failed to fetch visualizations' }, { status: 500 })
    }

    return Response.json({ visualizations: data || [] })
  } catch (e: any) {
    console.error('Unexpected error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, name, description, query, chartType, chartData, config } = body

    if (!userId || !name || !query || !chartType || !chartData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_visualizations')
      .insert({
        user_id: userId,
        name,
        description: description || null,
        query,
        chart_type: chartType,
        chart_data: chartData,
        config: config || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving visualization:', error)
      return Response.json({ error: 'Failed to save visualization' }, { status: 500 })
    }

    return Response.json({ visualization: data })
  } catch (e: any) {
    console.error('Unexpected error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
