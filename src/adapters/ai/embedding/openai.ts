import type { EmbeddingProvider } from '@/core/types/search';

/**
 * OpenAI embedding adapter. Uses text-embedding-3-small (1536 dims).
 */
export function createOpenAiEmbeddingProvider(apiKey: string): EmbeddingProvider {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const model = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

  return {
    async embed(text: string): Promise<number[]> {
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input: text }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json() as {
        data: Array<{ embedding: number[] }>;
      };
      const embedding = data.data[0]?.embedding;
      if (!embedding) throw new Error('Empty embedding response');
      return embedding;
    },

    async embedBatch(texts: string[]): Promise<number[][]> {
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input: texts }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json() as {
        data: Array<{ embedding: number[]; index: number }>;
      };

      // Sort by index to maintain order
      return data.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    },
  };
}
