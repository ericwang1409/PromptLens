import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { userId, isFavorite, tags, metadata } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const updateData: any = {}

    if (typeof isFavorite === 'boolean') {
      updateData.is_favorite = isFavorite
    }

    if (tags) {
      updateData.tags = tags
    }

    if (metadata) {
      updateData.metadata = metadata
    }

    const { data, error } = await supabase
      .from('query_history')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating query history:', error)
      return NextResponse.json({ error: 'Failed to update query history' }, { status: 500 })
    }

    return NextResponse.json({ query: data })
  } catch (error) {
    console.error('Error in query history PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('query_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting query history:', error)
      return NextResponse.json({ error: 'Failed to delete query history' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in query history DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
