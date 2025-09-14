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
  segments?: any;
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
    const { graphType, usedField, keywords } = await this.decidePlan(adminQuery);

    console.log("graphType", graphType)

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
    const keyTerms = keywords.length ? keywords : [];

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
    const matchedMapFirst = this.search(termToEmbedding, candidateEmbeddings);
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
      const matchedMapSecondRel = this.search(refinedTermToEmbedding, subsetEmbeddings);

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

    // 4b) Build segment -> recordId mappings for UI drill-down (no extra agent work later)
    const segments: any = {};
    if (graphType === 'pie') {
      const map: Record<string, string[]> = {};
      for (const [term, idxs] of Object.entries(finalMatchedMap)) {
        map[term] = idxs.map(idx => records[candidates[idx].i].id);
      }
      segments.pie = map;
    } else if (graphType === 'line') {
      const lineMap: Record<string, Record<string, string[]>> = {};
      for (const [term, idxs] of Object.entries(finalMatchedMap)) {
        for (const idx of idxs) {
          const rec = records[candidates[idx].i];
          const day = (rec.created_at || '').slice(0, 10);
          if (!lineMap[day]) lineMap[day] = {};
          if (!lineMap[day][term]) lineMap[day][term] = [];
          lineMap[day][term].push(rec.id);
        }
      }
      segments.line = lineMap;
    } else if (graphType === 'bar') {
      const barMap: Record<string, Record<string, string[]>> = {};
      for (const [term, idxs] of Object.entries(finalMatchedMap)) {
        for (const idx of idxs) {
          const rec = records[candidates[idx].i];
          const user = rec.user_id || 'unknown';
          if (!barMap[user]) barMap[user] = {};
          if (!barMap[user][term]) barMap[user][term] = [];
          barMap[user][term].push(rec.id);
        }
      }
      segments.bar = barMap;
    }

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
      segments,
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
      originalKeywords.length ? `Original query categories/topics: ${originalKeywords.join(', ')}` : 'Original query categories/topics: (none)',
      'If the admin query has not requested any categories/topics, return an empty keywords list.',
      'If the original query categories/topics are empty, based on the admin query, create a set of categories/topics, minimizing the number of categories chosen, that cover what the user has requested to be visualized and populate the keywords list with the categories/topics.',
      'If you deem that the original query categories/topics cover the range of keywords, return the original query categories/topics.',
      `Otherwise, choose a set of categories/topics related to the original query categories/topics, minimizing the number of categories/topics chosen, based on the original prompt, original query categories/topics, and candidate keywords.`,
      '',
      'Candidate keywords (keyword (count)):',
      candidates.join(', '),
      `Return JSON in this schema: ${parser.getFormatInstructions()}`,
    ].join('\n');

    console.log("prompt", prompt)

    try {
      const completion = await this.llm.invoke([{ role: 'user', content: prompt }] as any);
      console.log("completion", completion.content)
      const parsed = await parser.parse((completion?.content as string) || '');
      const set = new Set(parsed.keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean));

      console.log("originalKeywords", originalKeywords)

      console.log("set", set)
      return Array.from(set).slice(0, maxKeywords);
    } catch {
      console.log("error")
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
      'You are a planner that creates a categories/topics list for semantic search.',
      'You are able to choose between pie and line graphs as graphType.',
      'If you are working with any time series data, you should choose line as graphType.',
      'Otherwise, you should choose pie as graphType.',
      'You are also able to choose between prompt and response as usedField.',
      'Check if the user has requested any categories/topics in the query.',
      'If the admin query has not requested any specific categories/topics (e.g. "show me daily prompt volume" or "what are the most common prompt categories"), return an empty keywords list.',
      'Otherwise, if the admin query has requested specific categories/topics, based on the admin query, create a set of categories/topics, minimizing the number of categories chosen, that cover what the user has requested to be visualized and populate the keywords list with the categories/topics. If a number of categories/topics is mentioned, choose that many categories. If the list of keywords is not specific to certain categories/topics, return an empty keywords list.',
      'You should not include the words prompt, prompts, response or responses.',
      `Admin query: "${query}"`,
      `Return JSON in this schema: ${parser.getFormatInstructions()}`
    ].join('\n');

    console.log("prompt", prompt)

    const completion = await this.llm.invoke([{ role: 'user', content: prompt }] as any);
    try {
      const parsed = await parser.parse(completion?.content as string);
      return parsed;
    } catch {
      // Minimal fallback
      return { graphType: 'pie', usedField: 'prompt', keywords: [] };
    }
  }

  private search(
    termToEmbedding: Map<string, number[]>,
    candidateEmbeddings: number[][]
  ): Record<string, number[]> {
    const results: Record<string, number[]> = {};
    const terms = Array.from(termToEmbedding.keys());
    if (terms.length === 0) {
      // No query terms: include all candidates under a single bucket
      results["all"] = candidateEmbeddings.map((_, idx) => idx);
      return results;
    }
    const embeddings = terms.map(t => termToEmbedding.get(t)!);
    const matches = this.matcher.batchThresholdSearch(embeddings, candidateEmbeddings, this.threshold) || [];
    terms.forEach((term, idx) => {
      results[term] = matches[idx] || [];
    });
    return results;
  }

  async details(
    adminQuery: string,
    options: { limit?: number; since?: Date; until?: Date; userId?: string },
    segment: { type: 'pie'; label: string } | { type: 'line'; timestamp: string; label?: string } | { type: 'bar'; group: string; label: string }
  ): Promise<Array<{ id: string; user_id: string; created_at: string; prompt: string | null; response: string | null }>> {
    const { graphType, usedField, keywords } = await this.decidePlan(adminQuery);

    const records = await this.db.fetchQueries({
      limit: options?.limit ?? 1000,
      since: options?.since,
      until: options?.until,
      fields: usedField,
      userId: options?.userId,
    });

    await this.db.ensureEmbeddings(records, this.embedder, usedField);

    const keyTerms = keywords.length ? keywords : [];
    const termToEmbedding = new Map<string, number[]>();
    if (keyTerms.length > 0) {
      const keywordEmbeddings = await this.embedder.generateBatchEmbeddings(keyTerms);
      keyTerms.forEach((t, i) => termToEmbedding.set(t, keywordEmbeddings[i]));
    }

    function toNumArray(v: unknown): number[] {
      if (Array.isArray(v)) return v as number[];
      if (typeof v === 'string' && v.startsWith('[')) return JSON.parse(v);
      return [];
    }

    const candidates = records.map((r, i) => {
      const raw = usedField === 'prompt' ? r.prompt_embedding : r.response_embedding;
      return { i, e: toNumArray(raw) };
    });
    const candidateEmbeddings: number[][] = candidates.map(c => c.e);

    // First pass
    const matchedMapFirst = this.search(termToEmbedding, candidateEmbeddings);
    const matchedIndicesFirst = Array.from(new Set(Object.values(matchedMapFirst).flat()));
    const matchedRecordsFirst: QueryRecord[] = matchedIndicesFirst.map((idx) => records[candidates[idx].i]);

    // Refine
    const refinedKeywords = await this.refineKeywordsFromRecords(matchedRecordsFirst, usedField, 5, keywords, adminQuery);
    let finalMatchedMap: Record<string, number[]> = matchedMapFirst;
    let finalMatchedIndices: number[] = matchedIndicesFirst;
    if (refinedKeywords.length > 0 && matchedIndicesFirst.length > 0) {
      const refinedEmbeddings = await this.embedder.generateBatchEmbeddings(refinedKeywords);
      const refinedTermToEmbedding = new Map<string, number[]>();
      refinedKeywords.forEach((t, i) => refinedTermToEmbedding.set(t, refinedEmbeddings[i]));
      const subsetEmbeddings = matchedIndicesFirst.map(idx => candidateEmbeddings[idx]);
      const matchedMapSecondRel = this.search(refinedTermToEmbedding, subsetEmbeddings);
      const mapped: Record<string, number[]> = {};
      for (const [term, relIdxs] of Object.entries(matchedMapSecondRel)) {
        mapped[term] = relIdxs.map(rel => matchedIndicesFirst[rel]);
      }
      finalMatchedMap = mapped;
      finalMatchedIndices = Array.from(new Set(Object.values(mapped).flat()));
    }

    // Filter by segment
    let indices: number[] = [];
    if (segment.type === 'pie') {
      indices = finalMatchedMap[segment.label] || [];
    } else if (segment.type === 'line') {
      const day = segment.timestamp.slice(0, 10);
      const pool = segment.label ? (finalMatchedMap[segment.label] || []) : finalMatchedIndices;
      indices = pool.filter(idx => (records[candidates[idx].i].created_at || '').slice(0, 10) === day);
    } else if (segment.type === 'bar') {
      const pool = finalMatchedMap[segment.label] || [];
      indices = pool.filter(idx => (records[candidates[idx].i].user_id || 'unknown') === segment.group);
    }

    const items = indices.map(idx => records[candidates[idx].i]).map(r => ({
      id: r.id,
      user_id: r.user_id,
      created_at: r.created_at,
      prompt: r.prompt,
      response: r.response,
    }));
    return items;
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
