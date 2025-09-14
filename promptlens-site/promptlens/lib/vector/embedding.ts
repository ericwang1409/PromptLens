import OpenAI from 'openai';

interface EmbeddingConfig {
  apiKey: string;
  model: string;
  timeout: number;
}

interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

class EmbeddingService {
  private client: OpenAI;
  private config: EmbeddingConfig;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      model: 'text-embedding-3-small',
      timeout: config.timeout || 30000,
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required. Set NEXT_PUBLIC_OPENAI_API_KEY environment variable or pass it in config.');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      maxRetries: 3,
      timeout: this.config.timeout
    });
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const cleanText = this.cleanText(text);

      if (!cleanText.trim()) {
        throw new Error('Input text cannot be empty');
      }

      const response = await this.client.embeddings.create({
        model: this.config.model,
        input: cleanText,
        encoding_format: 'float'
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data received from OpenAI');
      }

      const embeddingData = response.data[0];

      return {
        embedding: embeddingData.embedding,
        tokens: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const clean = texts.map(t => this.cleanText(t)).filter(t => t.trim());
    if (clean.length === 0) return [];
    const resp = await this.client.embeddings.create({
      model: this.config.model,
      input: clean,
      encoding_format: 'float'
    });
    if (!resp.data || resp.data.length !== clean.length) {
      throw new Error('Batch embeddings length mismatch');
    }
    return resp.data.map(d => d.embedding);
  }

  getEmbeddingDimensions(): number {
    return 1536;
  }

  private cleanText(text: string): string {
    if (typeof text !== 'string') {
      throw new Error('Input must be a string');
    }

    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
      .substring(0, 8000); // Limit length to avoid token limits
  }

  updateConfig(newConfig: Partial<EmbeddingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.apiKey) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        maxRetries: 3,
        timeout: this.config.timeout,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }
}

export {
  EmbeddingService,
  type EmbeddingConfig,
  type EmbeddingResult
};
