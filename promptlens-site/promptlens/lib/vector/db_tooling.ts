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
}

interface FetchParams {
  limit?: number;
  since?: Date;
  until?: Date;
  fields?: 'prompt' | 'response' | 'both';
}

class DbTooling {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async fetchQueries(params: FetchParams = {}): Promise<QueryRecord[]> {
    const { limit = 1000, since, until, fields = 'both' } = params;

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

    const { data, error } = await q;
    if (error) throw new Error(`fetchQueries failed: ${error.message}`);
    return (data || []) as unknown as QueryRecord[];
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


