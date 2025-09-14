import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmbeddingService } from './embedding';

interface QueryRecord {
  id: string;
  user_id: string;
  prompt: string | null;
  response: string | null;
  prompt_embedding: number[] | null;
  response_embedding: number[] | null;
  created_at: string;
  keywords?: string[] | string | null;
}

interface FetchParams {
  limit?: number;
  since?: Date;
  until?: Date;
  fields?: 'prompt' | 'response' | 'both';
  userId?: string;
}

class DbTooling {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async fetchQueries(params: FetchParams = {}): Promise<QueryRecord[]> {
    const { limit = 1000, since, until, fields = 'both', userId } = params;

    const selectCols = [
      'id',
      'user_id',
      'created_at',
      fields === 'response' ? null : 'prompt',
      fields === 'response' ? null : 'prompt_embedding',
      fields === 'prompt' ? null : 'response',
      fields === 'prompt' ? null : 'response_embedding',
    ]
      .filter(Boolean)
      .join(', ');

    let q = this.supabase.from('queries').select(selectCols).order('created_at', { ascending: true }).limit(limit);

    if (since) q = q.gte('created_at', since.toISOString());
    if (until) q = q.lte('created_at', until.toISOString());
    if (userId) q = q.eq('user_id', userId);

    const { data, error } = await q;
    if (error) throw new Error(`fetchQueries failed: ${error.message}`);
    return (data || []) as unknown as QueryRecord[];
  }

  async aggregateKeywords(params: { since?: Date; until?: Date; limit?: number; perRecordDedup?: boolean; userId?: string } = {}): Promise<Array<{ keyword: string; count: number }>> {
    // Default now counts repeats within a single record for extra context
    const { since, until, limit = 100, perRecordDedup = false, userId } = params;
    let q = this.supabase
      .from('queries')
      .select('id, created_at, keywords')
      .order('created_at', { ascending: true })
      .limit(20000);

    if (since) q = q.gte('created_at', since.toISOString());
    if (until) q = q.lte('created_at', until.toISOString());
    if (userId) q = q.eq('user_id', userId);

    const { data, error } = await q;
    if (error) throw new Error(`aggregateKeywords fetch failed: ${error.message}`);

    const counts = new Map<string, number>();
    const normalize = (k: string) => k.toLowerCase().trim().replace(/\s+/g, ' ');

    for (const row of (data || []) as Array<Pick<QueryRecord, 'keywords'>>) {
      let kws: string[] = [];
      const raw = row?.keywords as unknown;
      if (Array.isArray(raw)) {
        kws = raw.map(v => String(v));
      } else if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) kws = parsed.map(v => String(v));
          else kws = raw.split(',');
        } catch {
          kws = raw.split(',');
        }
      }

      if (perRecordDedup) {
        const seen = new Set<string>();
        for (let kw of kws) {
          kw = normalize(kw);
          if (!kw) continue;
          if (seen.has(kw)) continue;
          seen.add(kw);
          counts.set(kw, (counts.get(kw) || 0) + 1);
        }
      } else {
        for (let kw of kws) {
          kw = normalize(kw);
          if (!kw) continue;
          counts.set(kw, (counts.get(kw) || 0) + 1);
        }
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  async ensureEmbeddings(
    records: QueryRecord[],
    embedder: EmbeddingService,
    which: 'prompt' | 'response' | 'both' = 'both'
  ): Promise<QueryRecord[]> {
    const needPrompt = which === 'prompt' || which === 'both';
    const needResponse = which === 'response' || which === 'both';

    for (const r of records) {
      const updates: Partial<QueryRecord> = {};

      if (needPrompt && (!r.prompt_embedding || r.prompt_embedding.length === 0) && r.prompt) {
        const emb = await embedder.generateEmbedding(r.prompt);
        updates.prompt_embedding = emb.embedding;
      }

      if (needResponse && (!r.response_embedding || r.response_embedding.length === 0) && r.response) {
        const emb = await embedder.generateEmbedding(r.response);
        updates.response_embedding = emb.embedding;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await this.supabase
          .from('queries')
          .update({
            prompt_embedding: updates.prompt_embedding ?? r.prompt_embedding,
            response_embedding: updates.response_embedding ?? r.response_embedding,
          })
          .eq('id', r.id);
        if (error) throw new Error(`ensureEmbeddings update failed for ${r.id}: ${error.message}`);

        r.prompt_embedding = updates.prompt_embedding ?? r.prompt_embedding;
        r.response_embedding = updates.response_embedding ?? r.response_embedding;
      }
    }

    return records;
  }
}

export { DbTooling, type QueryRecord, type FetchParams };


