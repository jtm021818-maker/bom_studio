import type { AiProvider } from '@/core/types/ai';
import { createOpenAiProvider } from './openai';
import { createDummyAiProvider } from './dummy';

/**
 * Get the AI provider singleton.
 * Uses OpenAI if OPENAI_API_KEY is set, otherwise falls back to dummy.
 */
let _cachedProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (_cachedProvider) return _cachedProvider;

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    _cachedProvider = createOpenAiProvider(apiKey);
  } else {
    console.warn('[AI] OPENAI_API_KEY not set — using dummy AI provider');
    _cachedProvider = createDummyAiProvider();
  }

  return _cachedProvider;
}
