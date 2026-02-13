import type { AiProvider, AiGenerateOptions, AiStreamChunk } from '@/core/types/ai';

/**
 * OpenAI adapter. Uses fetch against the OpenAI Chat Completions API.
 * Requires OPENAI_API_KEY environment variable.
 */
export function createOpenAiProvider(apiKey: string): AiProvider {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  return {
    async generate(options: AiGenerateOptions): Promise<string> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt },
          ],
          max_tokens: options.maxTokens ?? 2000,
          temperature: options.temperature ?? 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message.content;
      if (!content) throw new Error('OpenAI returned empty response');
      return content;
    },

    async *generateStream(options: AiGenerateOptions): AsyncGenerator<AiStreamChunk> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt },
          ],
          max_tokens: options.maxTokens ?? 2000,
          temperature: options.temperature ?? 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              yield { content: '', done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data) as {
                choices: Array<{ delta: { content?: string }; finish_reason?: string | null }>;
              };
              const delta = parsed.choices[0]?.delta.content;
              const finishReason = parsed.choices[0]?.finish_reason;

              if (delta) {
                yield { content: delta, done: false };
              }
              if (finishReason === 'stop') {
                yield { content: '', done: true };
                return;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      yield { content: '', done: true };
    },
  };
}
