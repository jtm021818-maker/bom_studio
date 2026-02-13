import { describe, it, expect } from 'vitest';
import { createDummyAiProvider } from '@/adapters/ai/dummy';

describe('createDummyAiProvider', () => {
  describe('generate', () => {
    it('returns a non-empty SOW template', async () => {
      const provider = createDummyAiProvider();
      const result = await provider.generate({
        systemPrompt: 'test',
        userPrompt: 'test',
      });

      expect(result).toContain('작업 범위 기술서');
      expect(result).toContain('프로젝트 개요');
      expect(result).toContain('납품물');
      expect(result.length).toBeGreaterThan(100);
    });
  });

  describe('generateStream', () => {
    it('streams chunks that combine to full template', async () => {
      const provider = createDummyAiProvider();
      let fullContent = '';
      let chunkCount = 0;
      let receivedDone = false;

      for await (const chunk of provider.generateStream({
        systemPrompt: 'test',
        userPrompt: 'test',
      })) {
        chunkCount++;
        if (chunk.done) {
          receivedDone = true;
        } else {
          fullContent += chunk.content;
        }
      }

      expect(chunkCount).toBeGreaterThan(1);
      expect(receivedDone).toBe(true);
      expect(fullContent).toContain('작업 범위 기술서');
      expect(fullContent).toContain('프로젝트 개요');
    });
  });
});
