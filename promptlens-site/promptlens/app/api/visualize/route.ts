import { Agent } from '../../../lib/vector/agent';
import { createClient } from '@supabase/supabase-js';

type ChartType = 'line' | 'bar' | 'pie';

type ChartData = {
  labels: string[];
  datasets: Array<{ label: string; data: number[]; backgroundColor?: string | string[]; borderColor?: string; fill?: boolean }>;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query: string = body?.query || '';

    // Get auth token from headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client to verify auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Extract token from Bearer token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const agent = new Agent({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      defaultThreshold: 0.1,
    });

    const result = await agent.run(query, { limit: 2000, userId: user.id });
    const chartType = result.graphType as ChartType;
    const data = mapAgentToChartData(chartType, result.data as any);

    return Response.json({
      title: suggestTitle(query, chartType),
      description: `Visualization for: "${query}"`,
      chartType,
      data
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 });
  }
}

function suggestTitle(q: string, type: string): string {
  if (!q) return `Generated ${type} chart`;
  return q.length > 64 ? `${q.slice(0, 61)}...` : q;
}

function mapAgentToChartData(type: ChartType, payload: any): ChartData {
  const colors = [
    'oklch(0.65 0.15 35)',
    'oklch(0.55 0.12 200)',
    'oklch(0.45 0.08 150)',
    'oklch(0.7 0.1 60)',
    'oklch(0.5 0.08 300)'
  ];

  if (type === 'pie') {
    const labels: string[] = (payload || []).map((d: any) => d.label);
    const values: number[] = (payload || []).map((d: any) => d.count);
    return {
      labels,
      datasets: [
        {
          label: 'Count',
          data: values,
          backgroundColor: colors
        }
      ]
    };
  }

  if (type === 'line') {
    const labels: string[] = (payload || []).map((d: any) => d.timestamp);
    const seriesLabels = Array.from(
      new Set<string>((payload || []).flatMap((d: any) => d.series.map((s: any) => s.label)))
    );
    const datasets = seriesLabels.map((sLabel, idx) => ({
      label: sLabel,
      data: labels.map((ts: string) => {
        const row = (payload || []).find((d: any) => d.timestamp === ts);
        const match = row?.series.find((s: any) => s.label === sLabel);
        return match?.count || 0;
      }),
      borderColor: colors[idx % colors.length],
      fill: true
    }));
    return { labels, datasets };
  }

  const labels: string[] = (payload || []).map((d: any) => d.group);
  const seriesLabels = Array.from(
    new Set<string>((payload || []).flatMap((d: any) => d.series.map((s: any) => s.label)))
  );
  const datasets = seriesLabels.map((sLabel, idx) => ({
    label: sLabel,
    data: labels.map((g: string) => {
      const row = (payload || []).find((d: any) => d.group === g);
      const match = row?.series.find((s: any) => s.label === sLabel);
      return match?.count || 0;
    }),
    backgroundColor: colors[idx % colors.length]
  }));
  return { labels, datasets };
}


