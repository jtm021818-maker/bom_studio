import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStoryboardUseCases } from '@/core/usecases/storyboard';
import type { AiProvider, AiStreamChunk } from '@/core/types/ai';
import type { SowGenerationInput } from '@/core/types/sow';

// ─── Mock Data ───
const mockInput: SowGenerationInput = {
  projectTitle: 'AI 뮤직비디오 제작',
  projectDescription: '몽환적인 AI 아트 스타일의 3분 뮤직비디오',
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

const mockInputNoBrief: SowGenerationInput = {
  projectTitle: '광고 영상',
  projectDescription: '브랜드 광고 영상 제작',
  category: 'advertisement',
  budgetMin: 300000,
  budgetMax: 800000,
  deadline: '2026-04-01',
};

// ─── Mock AI Provider ───
function createMockAiProvider(): AiProvider {
  return {
    generate: vi.fn(),
    generateStream: vi.fn(),
  };
}

describe('createStoryboardUseCases', () => {
  let aiProvider: ReturnType<typeof createMockAiProvider>;
  let useCases: ReturnType<typeof createStoryboardUseCases>;

  beforeEach(() => {
    aiProvider = createMockAiProvider();
    useCases = createStoryboardUseCases(aiProvider);
  });

  // ─── generateStoryboard (non-streaming) ───
  describe('generateStoryboard', () => {
    it('generates storyboard using AI provider', async () => {
      const mockStoryboard = '## 장면 1: 오프닝\n- 비주얼: 사이버펑크 도시 전경';
      vi.mocked(aiProvider.generate).mockResolvedValue(mockStoryboard);

      const result = await useCases.generateStoryboard(mockInput);

      expect(result).toBe(mockStoryboard);
      expect(aiProvider.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('스토리보드'),
          userPrompt: expect.stringContaining('AI 뮤직비디오 제작'),
          maxTokens: 3000,
          temperature: 0.7,
        })
      );
    });

    it('includes video brief in prompt when available', async () => {
      vi.mocked(aiProvider.generate).mockResolvedValue('스토리보드 내용');

      await useCases.generateStoryboard(mockInput);

      const callArgs = vi.mocked(aiProvider.generate).mock.calls[0];
      expect(callArgs).toBeDefined();
      const options = callArgs![0];
      expect(options.userPrompt).toContain('사이버펑크 AI 아트');
      expect(options.userPrompt).toContain('실사 인물');
    });

    it('works without video brief', async () => {
      vi.mocked(aiProvider.generate).mockResolvedValue('스토리보드');

      await useCases.generateStoryboard(mockInputNoBrief);

      const callArgs = vi.mocked(aiProvider.generate).mock.calls[0];
      expect(callArgs).toBeDefined();
      const options = callArgs![0];
      expect(options.userPrompt).toContain('광고 영상');
      expect(options.userPrompt).not.toContain('영상 브리프');
    });
  });

  // ─── generateShotlist (non-streaming) ───
  describe('generateShotlist', () => {
    it('generates shotlist using AI provider', async () => {
      const mockShotlist = '| 샷 번호 | 카메라 | 움직임 |';
      vi.mocked(aiProvider.generate).mockResolvedValue(mockShotlist);

      const result = await useCases.generateShotlist(mockInput);

      expect(result).toBe(mockShotlist);
      expect(aiProvider.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('샷 리스트'),
          userPrompt: expect.stringContaining('AI 뮤직비디오 제작'),
        })
      );
    });
  });

  // ─── generateStoryboardStream ───
  describe('generateStoryboardStream', () => {
    it('streams storyboard chunks from AI provider', async () => {
      const chunks: AiStreamChunk[] = [
        { content: '## 장면 1', done: false },
        { content: '\n오프닝 시퀀스', done: false },
        { content: '', done: true },
      ];

      async function* mockStream(): AsyncGenerator<AiStreamChunk> {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      vi.mocked(aiProvider.generateStream).mockReturnValue(mockStream());

      const collected: AiStreamChunk[] = [];
      for await (const chunk of useCases.generateStoryboardStream(mockInput)) {
        collected.push(chunk);
      }

      expect(collected).toHaveLength(3);
      expect(collected[0]?.content).toBe('## 장면 1');
      expect(collected[2]?.done).toBe(true);
      expect(aiProvider.generateStream).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('스토리보드'),
        })
      );
    });
  });

  // ─── generateShotlistStream ───
  describe('generateShotlistStream', () => {
    it('streams shotlist chunks from AI provider', async () => {
      const chunks: AiStreamChunk[] = [
        { content: '| 1 | 와이드 |', done: false },
        { content: '', done: true },
      ];

      async function* mockStream(): AsyncGenerator<AiStreamChunk> {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      vi.mocked(aiProvider.generateStream).mockReturnValue(mockStream());

      const collected: AiStreamChunk[] = [];
      for await (const chunk of useCases.generateShotlistStream(mockInput)) {
        collected.push(chunk);
      }

      expect(collected).toHaveLength(2);
      expect(collected[0]?.content).toContain('와이드');
      expect(aiProvider.generateStream).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('샷 리스트'),
        })
      );
    });
  });
});
