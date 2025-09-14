interface MatchingConfig {
  defaultThreshold: number;
}

interface SimilarityResult {
  similarity: number;
  isRelevant: boolean;
}

interface BatchSimilarityResult {
  similarities: number[];
  relevantIndices: number[];
  averageSimilarity: number;
}

interface ThresholdTuningResult {
  optimalThreshold: number;
  precision: number;
  recall: number;
  f1: number;
}

interface LabeledPair {
  embedding1: number[];
  embedding2: number[];
  isRelated: boolean;
}

class MatchingService {
  private config: MatchingConfig;

  constructor(config: Partial<MatchingConfig> = {}) {
    this.config = {
      defaultThreshold: config.defaultThreshold || 0.2
    };
  }

  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  isMatch(embedding1: number[], embedding2: number[], threshold?: number): SimilarityResult {
    const similarity = this.cosineSimilarity(embedding1, embedding2);
    const useThreshold = threshold ?? this.config.defaultThreshold;
    
    return {
      similarity,
      isRelevant: similarity >= useThreshold
    };
  }

  findBestMatch(
    queryEmbedding: number[], 
    candidateEmbeddings: number[][], 
    threshold?: number
  ): { index: number; similarity: number; isRelevant: boolean } | null {
    if (candidateEmbeddings.length === 0) {
      return null;
    }

    let bestIndex = 0;
    let bestSimilarity = this.cosineSimilarity(queryEmbedding, candidateEmbeddings[0]);

    for (let i = 1; i < candidateEmbeddings.length; i++) {
      const similarity = this.cosineSimilarity(queryEmbedding, candidateEmbeddings[i]);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestIndex = i;
      }
    }

    const useThreshold = threshold ?? this.config.defaultThreshold;
    
    return {
      index: bestIndex,
      similarity: bestSimilarity,
      isRelevant: bestSimilarity >= useThreshold
    };
  }

  batchSimilarity(
    queryEmbedding: number[], 
    candidateEmbeddings: number[][], 
    threshold?: number
  ): BatchSimilarityResult {
    const similarities = candidateEmbeddings.map(candidate => 
      this.cosineSimilarity(queryEmbedding, candidate)
    );

    const useThreshold = threshold ?? this.config.defaultThreshold;
    const relevantIndices = similarities
      .map((sim, index) => ({ sim, index }))
      .filter(item => item.sim >= useThreshold)
      .map(item => item.index);

    const averageSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;

    return {
      similarities,
      relevantIndices,
      averageSimilarity
    };
  }

  getTopMatches(
    queryEmbedding: number[], 
    candidateEmbeddings: number[][], 
    k: number = 5,
    threshold?: number
  ): Array<{ index: number; similarity: number; isRelevant: boolean }> {
    const results = candidateEmbeddings.map((candidate, index) => ({
      index,
      similarity: this.cosineSimilarity(queryEmbedding, candidate),
      isRelevant: false
    }));

    results.sort((a, b) => b.similarity - a.similarity);
    const topK = results.slice(0, k);

    const useThreshold = threshold ?? this.config.defaultThreshold;
    topK.forEach(result => {
      result.isRelevant = result.similarity >= useThreshold;
    });

    return topK;
  }

  similarityMatrix(
    queryEmbeddings: number[][],
    candidateEmbeddings: number[][]
  ): number[][] {
    return queryEmbeddings.map(q => candidateEmbeddings.map(c => this.cosineSimilarity(q, c)));
  }

  batchTopMatches(
    queryEmbeddings: number[][],
    candidateEmbeddings: number[][],
    k: number = 5,
    threshold?: number
  ): Array<Array<{ index: number; similarity: number; isRelevant: boolean }>> {
    const results: Array<Array<{ index: number; similarity: number; isRelevant: boolean }>> = [];
    for (const q of queryEmbeddings) {
      results.push(this.getTopMatches(q, candidateEmbeddings, k, threshold));
    }
    return results;
  }

  batchThresholdSearch(
    queryEmbeddings: number[][],
    candidateEmbeddings: number[][],
    threshold?: number
  ): Array<number[]> {
    const useThreshold = threshold ?? this.config.defaultThreshold;
    const out: Array<number[]> = [];
    for (const q of queryEmbeddings) {
      const indices: number[] = [];
      for (let i = 0; i < candidateEmbeddings.length; i++) {
        const sim = this.cosineSimilarity(q, candidateEmbeddings[i]);
        if (sim >= useThreshold) indices.push(i);
      }
      out.push(indices);
    }
    return out;
  }

  private calculateMetrics(
    similarities: Array<{ similarity: number; isRelated: boolean }>, 
    threshold: number
  ): { precision: number; recall: number; f1: number } {
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    similarities.forEach(({ similarity, isRelated }) => {
      const predicted = similarity >= threshold;
      
      if (predicted && isRelated) truePositives++;
      else if (predicted && !isRelated) falsePositives++;
      else if (!predicted && isRelated) falseNegatives++;
    });

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    return { precision, recall, f1 };
  }

  tuneThreshold(
    labeledPairs: LabeledPair[],
    optimizeFor: 'f1' | 'precision' | 'recall' = 'f1',
    thresholdRange: { min: number; max: number; step: number } = { min: 0.1, max: 0.9, step: 0.05 }
  ): ThresholdTuningResult {
    const similarities = labeledPairs.map(pair => ({
      similarity: this.cosineSimilarity(pair.embedding1, pair.embedding2),
      isRelated: pair.isRelated
    }));

    let bestThreshold = thresholdRange.min;
    let bestScore = 0;
    let bestMetrics = { precision: 0, recall: 0, f1: 0 };

    for (let threshold = thresholdRange.min; threshold <= thresholdRange.max; threshold += thresholdRange.step) {
      const metrics = this.calculateMetrics(similarities, threshold);
      const score = metrics[optimizeFor];

      if (score > bestScore) {
        bestScore = score;
        bestThreshold = threshold;
        bestMetrics = metrics;
      }
    }

    this.config.defaultThreshold = bestThreshold;

    return {
      optimalThreshold: bestThreshold,
      precision: bestMetrics.precision,
      recall: bestMetrics.recall,
      f1: bestMetrics.f1
    };
  }

  setThreshold(threshold: number): void {
    this.config.defaultThreshold = threshold;
  }

  getThreshold(): number {
    return this.config.defaultThreshold;
  }

  getConfig(): MatchingConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<MatchingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export {
  MatchingService,
  type MatchingConfig,
  type SimilarityResult,
  type BatchSimilarityResult,
  type ThresholdTuningResult,
  type LabeledPair
};