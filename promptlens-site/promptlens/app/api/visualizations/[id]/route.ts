import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const { data, error } = await supabase
      .from('saved_visualizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Visualization not found' }, { status: 404 })
    }

    // Check permissions - user can only access their own visualizations
    if (data.user_id !== userId) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    return Response.json({ visualization: data })
  } catch (e: any) {
    console.error('Unexpected error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const { userId, name, description } = body

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user owns the visualization
    const { data: existing, error: fetchError } = await supabase
      .from('saved_visualizations')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return Response.json({ error: 'Visualization not found' }, { status: 404 })
    }

    if (existing.user_id !== userId) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabase
      .from('saved_visualizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating visualization:', error)
      return Response.json({ error: 'Failed to update visualization' }, { status: 500 })
    }

    return Response.json({ visualization: data })
  } catch (e: any) {
    console.error('Unexpected error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user owns the visualization
    const { data: existing, error: fetchError } = await supabase
      .from('saved_visualizations')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return Response.json({ error: 'Visualization not found' }, { status: 404 })
    }

    if (existing.user_id !== userId) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const { error } = await supabase
      .from('saved_visualizations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting visualization:', error)
      return Response.json({ error: 'Failed to delete visualization' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (e: any) {
    console.error('Unexpected error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
