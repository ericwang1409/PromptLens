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

  async run(adminQuery: string, options?: { limit?: number; since?: Date; until?: Date }): Promise<AgentResult> {
    const { graphType, usedField, keywords } = await this.decidePlan(adminQuery);

    // 1) Fetch records (lightweight, only needed fields) and ensure embeddings
    const records = await this.db.fetchQueries({
      limit: options?.limit ?? 1000,
      since: options?.since,
      until: options?.until,
      fields: usedField,
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

    // Hierarchical matching using the keyword graph: start at root, then children, narrowing or branching
    const matchedMap = this.hierarchicalSearch(termToEmbedding, candidateEmbeddings);

    const matchedIndices = Array.from(new Set(Object.values(matchedMap).flat()));

    const matchedRecords: QueryRecord[] = matchedIndices.map((idx) => records[candidates[idx].i]);

    // 4) Extract keywords and aggregate per graph type
    const result = this.generateGraphDataFromMatches(graphType, matchedMap, records, candidates, usedField);

    return {
      graphType,
      data: result,
      meta: {
        usedField,
        query: adminQuery,
        threshold: this.threshold,
        totalCandidates: candidateEmbeddings.length,
        matchedCount: matchedRecords.length,
      },
    };
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
