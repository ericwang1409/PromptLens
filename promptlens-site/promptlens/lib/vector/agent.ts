import { EmbeddingService } from './embedding';
import { MatchingService } from './matching';
import { DbTooling, type QueryRecord } from './db_tooling';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';

type GraphType = 'pie' | 'line' | 'bar';

interface AgentConfig {
  supabaseUrl: string;
  supabaseKey: string;
  defaultThreshold?: number;
  openaiApiKey?: string;
}

interface PieDatum { label: string; count: number; }
interface LineDatum { timestamp: string; series: Array<{ label: string; count: number }>; }
interface BarDatum { group: string; series: Array<{ label: string; count: number }>; }

interface AgentResult {
  graphType: GraphType;
  data: PieDatum[] | LineDatum[] | BarDatum[];
  meta: {
    usedField: 'prompt' | 'response';
    query: string;
    threshold: number;
    totalCandidates: number;
    matchedCount: number;
  };
}

class Agent {
  private embedder: EmbeddingService;
  private matcher: MatchingService;
  private db: DbTooling;
  private threshold: number;
  private llm: ChatOpenAI;

  constructor(config: AgentConfig) {
    this.embedder = new EmbeddingService();
    this.matcher = new MatchingService({ defaultThreshold: config.defaultThreshold ?? 0.2 });
    this.db = new DbTooling(config.supabaseUrl, config.supabaseKey);
    this.threshold = this.matcher.getThreshold();
    this.llm = new ChatOpenAI({
      apiKey: config.openaiApiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      model: 'gpt-4o-mini',
      temperature: 0
    });
  }

  async run(adminQuery: string, options?: { limit?: number; since?: Date; until?: Date; userId?: string }): Promise<AgentResult> {
    // const { graphType, usedField, keywords } = await this.decidePlan(adminQuery);
    // Aggregate historical keywords to use as planning context
    const topKeywords = await this.db.aggregateKeywords({ since: options?.since, until: options?.until, limit: 50, userId: options?.userId });
    const contextKeywords = topKeywords.map(k => `${k.keyword} (${k.count})`).join(', ');
    const { graphType, usedField, keywords } = await this.decidePlan(`${adminQuery}\n\nContext keywords (top): ${contextKeywords}`);

    // 1) Fetch records (lightweight, only needed fields) and ensure embeddings
    const records = await this.db.fetchQueries({
      limit: options?.limit ?? 1000,
      since: options?.since,
      until: options?.until,
      fields: usedField,
      userId: options?.userId,
    });

    await this.db.ensureEmbeddings(records, this.embedder, usedField);

    // 2) Build a query embedding for the adminQuery
    // Embed keyword graph nodes in batches
    const keyTerms = keywords.length ? keywords : [adminQuery];

    const keywordEmbeddings = await this.embedder.generateBatchEmbeddings(keyTerms);

    const termToEmbedding = new Map<string, number[]>();

    keyTerms.forEach((t, i) => termToEmbedding.set(t, keywordEmbeddings[i]));

    // 3) Rank and filter records by cosine similarity

    function toNumArray(v: unknown): number[] {
      if (Array.isArray(v)) return v as number[];
      if (typeof v === 'string' && v.startsWith('[')) return JSON.parse(v);
      return [];
    }
    
    const candidates = records
    .map((r, i) => {
      const raw = usedField === 'prompt' ? r.prompt_embedding : r.response_embedding;
      return { i, e: toNumArray(raw) };
    });
    // .filter(({ e }) => e.length > 0);

    const candidateEmbeddings: number[][] = candidates.map(c => c.e);

    // First pass search over all candidates
    const matchedMapFirst = this.hierarchicalSearch(termToEmbedding, candidateEmbeddings);
    const matchedIndicesFirst = Array.from(new Set(Object.values(matchedMapFirst).flat()));
    const matchedRecordsFirst: QueryRecord[] = matchedIndicesFirst.map((idx) => records[candidates[idx].i]);

    // Derive refined keywords from first-pass matches using LLM
    const refinedKeywords = await this.refineKeywordsFromRecords(matchedRecordsFirst, usedField, 5, keywords, adminQuery);

    let finalMatchedMap: Record<string, number[]> = matchedMapFirst;
    let finalMatchedIndices: number[] = matchedIndicesFirst;

    if (refinedKeywords.length > 0 && matchedIndicesFirst.length > 0) {
      const refinedEmbeddings = await this.embedder.generateBatchEmbeddings(refinedKeywords);
      const refinedTermToEmbedding = new Map<string, number[]>();
      refinedKeywords.forEach((t, i) => refinedTermToEmbedding.set(t, refinedEmbeddings[i]));

      // Restrict to first-pass matches to sharpen the search
      const subsetEmbeddings = matchedIndicesFirst.map(idx => candidateEmbeddings[idx]);
      const matchedMapSecondRel = this.hierarchicalSearch(refinedTermToEmbedding, subsetEmbeddings);

      // Remap back to original candidate indices
      const matchedMapSecond: Record<string, number[]> = {};
      for (const [term, relIdxs] of Object.entries(matchedMapSecondRel)) {
        matchedMapSecond[term] = relIdxs.map(rel => matchedIndicesFirst[rel]);
      }

      finalMatchedMap = matchedMapSecond;
      finalMatchedIndices = Array.from(new Set(Object.values(matchedMapSecond).flat()));
    }

    // 4) Aggregate per graph type from final matches
    const result = this.generateGraphDataFromMatches(graphType, finalMatchedMap, records, candidates, usedField);

    return {
      graphType,
      data: result,
      meta: {
        usedField,
        query: adminQuery,
        threshold: this.threshold,
        totalCandidates: candidateEmbeddings.length,
        matchedCount: finalMatchedIndices.length,
      },
    };
  }

  private async refineKeywordsFromRecords(
    records: QueryRecord[],
    usedField: 'prompt' | 'response',
    maxKeywords: number = 5,
    originalKeywords: string[] = [],
    originalPrompt: string = ''
  ): Promise<string[]> {
    if (!records.length) return [];

    // Build candidate keywords from records.keywords (array or JSON/comma string)
    const normalize = (k: string) => k.toLowerCase().trim().replace(/\s+/g, ' ');
    const counts = new Map<string, number>();
    for (const r of records) {
      const raw: unknown = (r as any).keywords;
      let kws: string[] = [];
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
      // Per-record dedupe to avoid overweighting repeated tokens in the same row
      const seen = new Set<string>();
      for (let kw of kws) {
        kw = normalize(kw);
        if (!kw) continue;
        if (seen.has(kw)) continue;
        seen.add(kw);
        counts.set(kw, (counts.get(kw) || 0) + 1);
      }
    }

    const candidates = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 150)
      .map(([k, c]) => `${k} (${c})`);

    // if (!candidates.length) return [];

    const parser = StructuredOutputParser.fromZodSchema(
      z.object({ keywords: z.array(z.string()).max(maxKeywords) })
    );

    const prompt = [
      'You refine search categories from candidate keywords (with frequencies).',
      originalPrompt ? `Original prompt: ${originalPrompt}` : 'Original prompt: (none)',
      originalKeywords.length ? `Original query keywords: ${originalKeywords.join(', ')}` : 'Original query keywords: (none)',
      `Choose a set of categories similar to the original query keywords that the user has requested that very closely match the original prompt and the candidate distribution. Return ${maxKeywords} or less categories.`,
      'Return JSON: { "keywords": string[] }',
      '',
      'Candidate keywords (keyword (count)):',
      candidates.join(', ')
    ].join('\n');

    console.log("prompt", prompt)

    try {
      const completion = await this.llm.invoke([{ role: 'user', content: prompt }] as any);
      const parsed = await parser.parse((completion?.content as string) || '');
      const set = new Set(parsed.keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean));
      console.log("set", set)
      return Array.from(set).slice(0, maxKeywords);
    } catch {
      return [];
    }
  }

  private async decidePlan(query: string): Promise<{ graphType: GraphType; usedField: 'prompt' | 'response'; keywords: string[]; }> {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        graphType: z.enum(['pie', 'line']),
        usedField: z.enum(['prompt', 'response']),
        keywords: z.array(z.string()).max(20),
      })
    );

    const prompt = [
      'You are a planner that creates a hierarchical keyword graph for semantic search.',
      'You are able to choose between pie and line graphs as graphType.',
      'You are also able to choose between prompt and response as usedField.',
      'Choose a set of categories that the user has requested to be visualized and populate the keywords list with the categories. If a number of categories is mentioned, choose that many categories. Otherwise, choose 5 or less categories.',
      'You should not include the words prompt, prompts, response or responses in the graph.',
      `Admin query: "${query}"`,
      `Return JSON in this schema: ${parser.getFormatInstructions()}`
    ].join('\n');

    const completion = await this.llm.invoke([{ role: 'user', content: prompt }] as any);
    try {
      const parsed = await parser.parse(completion?.content as string);
      return parsed;
    } catch {
      // Minimal fallback
      return { graphType: 'pie', usedField: 'prompt', keywords: [] };
    }
  }

  private hierarchicalSearch(
    termToEmbedding: Map<string, number[]>,
    candidateEmbeddings: number[][]
  ): Record<string, number[]> {
    const results: Record<string, number[]> = {};
    const terms = Array.from(termToEmbedding.keys());
    if (terms.length === 0) return results;
    const embeddings = terms.map(t => termToEmbedding.get(t)!);
    const matches = this.matcher.batchThresholdSearch(embeddings, candidateEmbeddings, this.threshold) || [];
    terms.forEach((term, idx) => {
      results[term] = matches[idx] || [];
    });
    return results;
  }

  private generateGraphDataFromMatches(
    graphType: GraphType,
    matchedMap: Record<string, number[]>,
    records: QueryRecord[],
    candidates: Array<{ i: number; e: number[] }>,
    usedField: 'prompt' | 'response'
  ): PieDatum[] | LineDatum[] | BarDatum[] {
    if (graphType === 'pie') {
      const counts = new Map<string, number>();
      for (const [term, idxs] of Object.entries(matchedMap)) counts.set(term, idxs.length);
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count }));
    }

    if (graphType === 'line') {
      const dayTermCounts = new Map<string, Map<string, number>>();
      for (const [term, idxs] of Object.entries(matchedMap)) {
        for (const idx of idxs) {
          const rec = records[candidates[idx].i];
          const day = (rec.created_at || '').slice(0, 10);
          if (!dayTermCounts.has(day)) dayTermCounts.set(day, new Map());
          const map = dayTermCounts.get(day)!;
          map.set(term, (map.get(term) || 0) + 1);
        }
      }
      return Array.from(dayTermCounts.keys()).sort().map(day => ({
        timestamp: day,
        series: Array.from(dayTermCounts.get(day)!.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([label, count]) => ({ label, count }))
      }));
    }

    // bar: group by user_id, per term counts
    const userTermCounts = new Map<string, Map<string, number>>();
    for (const [term, idxs] of Object.entries(matchedMap)) {
      for (const idx of idxs) {
        const rec = records[candidates[idx].i];
        const user = rec.user_id || 'unknown';
        if (!userTermCounts.has(user)) userTermCounts.set(user, new Map());
        const map = userTermCounts.get(user)!;
        map.set(term, (map.get(term) || 0) + 1);
      }
    }
    return Array.from(userTermCounts.entries()).map(([group, map]) => ({
      group,
      series: Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count }))
    }));
  }
}

export { Agent, type AgentConfig, type AgentResult };
