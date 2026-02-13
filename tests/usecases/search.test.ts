import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EmbeddingProvider } from '@/core/types/search';

/**
 * Search use case tests.
 *
 * Note: createSearchUseCases imports `db` from '@/adapters/db/client' directly,
 * making it tightly coupled to raw SQL. We test the embedding provider interactions
 * and input building logic by mocking at the module level.
 */

// Mock the db module before importing search
vi.mock('@/adapters/db/client', () => ({
  db: {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

// Import after mock
import { createSearchUseCases } from '@/core/usecases/search';
import { db } from '@/adapters/db/client';

// ─── Mock Embedding Provider ───
function createMockEmbeddingProvider(): EmbeddingProvider {
  return {
    embed: vi.fn(),
    embedBatch: vi.fn(),
  };
}

describe('createSearchUseCases', () => {
  let embeddingProvider: ReturnType<typeof createMockEmbeddingProvider>;
  let useCases: ReturnType<typeof createSearchUseCases>;

  beforeEach(() => {
    vi.clearAllMocks();
    embeddingProvider = createMockEmbeddingProvider();
    useCases = createSearchUseCases(embeddingProvider);
  });

  // ─── searchCreators ───
  describe('searchCreators', () => {
    it('searches without query (hard filters only)', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [
        {
          profile_id: 'p1',
          name: '김크리',
          intro: 'AI 전문',
          skills: ['runway'],
          tools: ['Runway'],
          availability: 'available',
          hourly_rate: '50000',
          similarity: null,
        },
      ] } as never);

      const result = await useCases.searchCreators({});

      expect(result).toHaveLength(1);
      expect(result[0]?.profileId).toBe('p1');
      expect(result[0]?.similarity).toBeNull();
      expect(embeddingProvider.embed).not.toHaveBeenCalled();
    });

    it('searches with query (vector similarity)', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      vi.mocked(embeddingProvider.embed).mockResolvedValue(mockEmbedding);
      vi.mocked(db.execute).mockResolvedValue({ rows: [
        {
          profile_id: 'p1',
          name: '김크리',
          intro: 'AI 영상 전문',
          skills: ['runway', 'sora'],
          tools: ['Runway'],
          availability: 'available',
          hourly_rate: '50000',
          similarity: 0.95,
        },
      ] } as never);

      const result = await useCases.searchCreators({ query: 'AI 영상 전문가' });

      expect(result).toHaveLength(1);
      expect(result[0]?.similarity).toBe(0.95);
      expect(embeddingProvider.embed).toHaveBeenCalledWith('AI 영상 전문가');
    });

    it('applies skills hard filter', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [] } as never);

      await useCases.searchCreators({ skills: ['runway', 'sora'] });

      expect(db.execute).toHaveBeenCalled();
    });

    it('applies availability hard filter', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [] } as never);

      await useCases.searchCreators({ availability: 'available' });

      expect(db.execute).toHaveBeenCalled();
    });

    it('returns empty array when no results', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [] } as never);

      const result = await useCases.searchCreators({});

      expect(result).toEqual([]);
    });
  });

  // ─── searchProjects ───
  describe('searchProjects', () => {
    it('searches without query (hard filters only)', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [
        {
          id: 'proj-1',
          title: 'AI 뮤직비디오',
          description: '테스트',
          category: 'music_video',
          budget_min: 500000,
          budget_max: 1500000,
          deadline: '2026-03-15T00:00:00Z',
          similarity: null,
        },
      ] } as never);

      const result = await useCases.searchProjects({});

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('proj-1');
      expect(result[0]?.similarity).toBeNull();
    });

    it('searches with query (vector similarity)', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      vi.mocked(embeddingProvider.embed).mockResolvedValue(mockEmbedding);
      vi.mocked(db.execute).mockResolvedValue({ rows: [
        {
          id: 'proj-1',
          title: 'AI 뮤직비디오',
          description: '뮤직비디오 제작',
          category: 'music_video',
          budget_min: 500000,
          budget_max: 1500000,
          deadline: '2026-03-15T00:00:00Z',
          similarity: 0.88,
        },
      ] } as never);

      const result = await useCases.searchProjects({ query: '뮤직비디오' });

      expect(result).toHaveLength(1);
      expect(result[0]?.similarity).toBe(0.88);
      expect(embeddingProvider.embed).toHaveBeenCalledWith('뮤직비디오');
    });

    it('applies category filter', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [] } as never);

      await useCases.searchProjects({ category: 'music_video' });

      expect(db.execute).toHaveBeenCalled();
    });

    it('applies budget range filters', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [] } as never);

      await useCases.searchProjects({ budgetMin: 100000, budgetMax: 500000 });

      expect(db.execute).toHaveBeenCalled();
    });

    it('returns deadline as Date object', async () => {
      vi.mocked(db.execute).mockResolvedValue({ rows: [
        {
          id: 'proj-1',
          title: 'Test',
          description: 'Desc',
          category: 'other',
          budget_min: 100000,
          budget_max: 200000,
          deadline: '2026-03-15T00:00:00Z',
          similarity: null,
        },
      ] } as never);

      const result = await useCases.searchProjects({});

      expect(result[0]?.deadline).toBeInstanceOf(Date);
    });
  });
});
