import type { EmbeddingProvider } from '@/core/types/search';

/**
 * Dummy embedding provider. Returns random normalized vectors.
 * Used when OPENAI_API_KEY is not set.
 */
export function createDummyEmbeddingProvider(): EmbeddingProvider {
  function randomVector(dims: number): number[] {
    const vec = Array.from({ length: dims }, () => Math.random() * 2 - 1);
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return vec.map((v) => v / norm);
  }

  return {
    async embed(_text: string): Promise<number[]> {
      return randomVector(1536);
    },

    async embedBatch(texts: string[]): Promise<number[][]> {
      return texts.map(() => randomVector(1536));
    },
  };
}
