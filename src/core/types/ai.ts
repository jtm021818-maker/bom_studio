/**
 * AI generation types shared across SOW, Storyboard, Shotlist generators.
 */

export interface AiStreamChunk {
  /** Incremental text content */
  content: string;
  /** Whether this is the final chunk */
  done: boolean;
}

export interface AiGenerateOptions {
  /** System prompt for the LLM */
  systemPrompt: string;
  /** User prompt (the actual request) */
  userPrompt: string;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Temperature (0-2) */
  temperature?: number;
}

export interface AiProvider {
  /** Generate text (non-streaming) */
  generate(options: AiGenerateOptions): Promise<string>;
  /** Generate text as a stream of chunks */
  generateStream(options: AiGenerateOptions): AsyncGenerator<AiStreamChunk>;
}
