import { describe, it, expect, vi } from 'vitest';
import { createSowUseCases } from '@/core/usecases/sow';
import type { AiProvider, AiStreamChunk } from '@/core/types/ai';
import type { SowGenerationInput } from '@/core/types/sow';

// ─── Mock AI Provider ───
function createMockAiProvider(overrides?: Partial<AiProvider>): AiProvider {
  return {
    generate: vi.fn().mockResolvedValue('# 작업 범위 기술서\n\n## 프로젝트 개요\nMock SOW content.'),
    async *generateStream() {
      yield { content: '# 작업 ', done: false };
      yield { content: '범위 기술서', done: false };
      yield { content: '', done: true };
    },
    ...overrides,
  };
}

const mockInput: SowGenerationInput = {
  projectTitle: 'AI 뮤직비디오 제작',
  projectDescription: '몽환적인 AI 아트 스타일의 3분 뮤직비디오 제작을 의뢰합니다.',
  category: 'music_video',
  budgetMin: 500000,
  budgetMax: 1500000,
  deadline: '2026-03-15',
  videoBrief: {
    channel: 'youtube_short',
    duration: '60초',
    resolution: '1080p',
    aspectRatio: '9:16',
    fps: '30',
    style: '사이버펑크 AI 아트',
    prohibitedElements: ['실사 인물'],
    referenceUrls: ['https://youtube.com/watch?v=example'],
  },
};

describe('createSowUseCases', () => {
  describe('generateSow', () => {
    it('calls AI provider with correct system prompt containing SOW instructions', async () => {
      const mockProvider = createMockAiProvider();
      const useCases = createSowUseCases(mockProvider);

      const result = await useCases.generateSow(mockInput);

      expect(result).toContain('작업 범위 기술서');
      expect(mockProvider.generate).toHaveBeenCalledOnce();
      
      const callArgs = vi.mocked(mockProvider.generate).mock.calls[0]?.[0];
      expect(callArgs?.systemPrompt).toContain('SOW');
      expect(callArgs?.systemPrompt).toContain('한국어');
    });

    it('includes project details in user prompt', async () => {
      const mockProvider = createMockAiProvider();
      const useCases = createSowUseCases(mockProvider);

      await useCases.generateSow(mockInput);

      const callArgs = vi.mocked(mockProvider.generate).mock.calls[0]?.[0];
      expect(callArgs?.userPrompt).toContain('AI 뮤직비디오 제작');
      expect(callArgs?.userPrompt).toContain('500,000');
      expect(callArgs?.userPrompt).toContain('1,500,000');
      expect(callArgs?.userPrompt).toContain('2026-03-15');
    });

    it('includes video brief in user prompt when provided', async () => {
      const mockProvider = createMockAiProvider();
      const useCases = createSowUseCases(mockProvider);

      await useCases.generateSow(mockInput);

      const callArgs = vi.mocked(mockProvider.generate).mock.calls[0]?.[0];
      expect(callArgs?.userPrompt).toContain('youtube_short');
      expect(callArgs?.userPrompt).toContain('1080p');
      expect(callArgs?.userPrompt).toContain('사이버펑크');
      expect(callArgs?.userPrompt).toContain('실사 인물');
    });

    it('works without video brief', async () => {
      const mockProvider = createMockAiProvider();
      const useCases = createSowUseCases(mockProvider);
      const inputWithoutBrief = { ...mockInput, videoBrief: undefined };

      const result = await useCases.generateSow(inputWithoutBrief);

      expect(result).toContain('작업 범위 기술서');
      const callArgs = vi.mocked(mockProvider.generate).mock.calls[0]?.[0];
      expect(callArgs?.userPrompt).not.toContain('영상 브리프');
    });

    it('propagates AI provider errors', async () => {
      const mockProvider = createMockAiProvider({
        generate: vi.fn().mockRejectedValue(new Error('API rate limit')),
      });
      const useCases = createSowUseCases(mockProvider);

      await expect(useCases.generateSow(mockInput)).rejects.toThrow('API rate limit');
    });
  });

  describe('generateSowStream', () => {
    it('yields chunks from AI provider', async () => {
      const mockProvider = createMockAiProvider();
      const useCases = createSowUseCases(mockProvider);

      const chunks: AiStreamChunk[] = [];
      for await (const chunk of useCases.generateSowStream(mockInput)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      // Last chunk should be done
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk?.done).toBe(true);
      // Content chunks should have text
      const contentChunks = chunks.filter((c) => !c.done);
      expect(contentChunks.length).toBeGreaterThan(0);
      const fullContent = contentChunks.map((c) => c.content).join('');
      expect(fullContent).toContain('작업 범위 기술서');
    });

    it('handles empty stream gracefully', async () => {
      const mockProvider = createMockAiProvider({
        async *generateStream() {
          yield { content: '', done: true };
        },
      });
      const useCases = createSowUseCases(mockProvider);

      const chunks: AiStreamChunk[] = [];
      for await (const chunk of useCases.generateSowStream(mockInput)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(1);
      expect(chunks[0]?.done).toBe(true);
    });
  });
});
