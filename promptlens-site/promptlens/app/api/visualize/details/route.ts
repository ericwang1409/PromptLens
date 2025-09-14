import { Agent } from '../../../../lib/vector/agent'
import { createClient } from '@supabase/supabase-js'

type SegmentSpec =
  | { type: 'pie'; label: string }
  | { type: 'line'; timestamp: string; label?: string }
  | { type: 'bar'; group: string; label: string }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const query: string = body?.query || ''
    const segment: SegmentSpec | undefined = body?.segment

    if (!segment) {
      return new Response(JSON.stringify({ error: 'segment is required' }), { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const agent = new Agent({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      defaultThreshold: 0.3,
    })

    const items = await agent.details(query, { limit: 2000, userId: user.id }, segment as any)

    return Response.json({ items })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 })
  }
}


