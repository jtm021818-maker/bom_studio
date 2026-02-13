import type { EmbeddingProvider } from '@/core/types/search';
import { createOpenAiEmbeddingProvider } from './openai';
import { createDummyEmbeddingProvider } from './dummy';

let _cachedProvider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (_cachedProvider) return _cachedProvider;

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    _cachedProvider = createOpenAiEmbeddingProvider(apiKey);
  } else {
    console.warn('[Embedding] OPENAI_API_KEY not set — using dummy embeddings');
    _cachedProvider = createDummyEmbeddingProvider();
  }

  return _cachedProvider;
}
