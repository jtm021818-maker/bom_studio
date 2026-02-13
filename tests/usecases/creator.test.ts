import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCreatorUseCases } from '@/core/usecases/creator';
import type { CreatorProfileRepository } from '@/core/ports/profile-repository';
import type { PortfolioRepository } from '@/core/ports/portfolio-repository';
import type { CreatorProfileData } from '@/core/types/profile';
import type { PortfolioItemData } from '@/core/types/portfolio';

// ─── Mock Data ───
const NOW = new Date('2026-02-12T00:00:00Z');

const mockCreator: CreatorProfileData = {
  id: 'creator-1',
  profileId: 'profile-1',
  intro: 'AI 영상 전문 크리에이터입니다.',
  skills: ['runway', 'midjourney', 'sora'],
  tools: ['Runway Gen-3', 'Midjourney V6'],
  availability: 'available',
  hourlyRate: '50000',
  portfolioUrl: null,
};

const mockPortfolioItem: PortfolioItemData = {
  id: 'item-1',
  creatorProfileId: 'creator-1',
  title: 'AI 뮤직비디오 샘플',
  description: '사이버펑크 스타일 뮤직비디오',
  fileUrl: 'https://storage.example.com/files/sample.mp4',
  thumbnailUrl: 'https://storage.example.com/thumbs/sample.jpg',
  mediaType: 'video',
  sortOrder: 0,
  createdAt: NOW,
};

const mockPortfolioItem2: PortfolioItemData = {
  ...mockPortfolioItem,
  id: 'item-2',
  title: '광고 영상 샘플',
  sortOrder: 1,
};

// ─── Mock Repositories ───
function createMockCreatorRepo(): CreatorProfileRepository {
  return {
    findByProfileId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

function createMockPortfolioRepo(): PortfolioRepository {
  return {
    findByCreatorProfileId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe('createCreatorUseCases', () => {
  let creatorRepo: ReturnType<typeof createMockCreatorRepo>;
  let portfolioRepo: ReturnType<typeof createMockPortfolioRepo>;
  let useCases: ReturnType<typeof createCreatorUseCases>;

  beforeEach(() => {
    creatorRepo = createMockCreatorRepo();
    portfolioRepo = createMockPortfolioRepo();
    useCases = createCreatorUseCases(creatorRepo, portfolioRepo);
  });

  // ─── getCreatorProfile ───
  describe('getCreatorProfile', () => {
    it('returns creator profile when found', async () => {
      vi.mocked(creatorRepo.findByProfileId).mockResolvedValue(mockCreator);

      const result = await useCases.getCreatorProfile('profile-1');

      expect(result).toEqual(mockCreator);
      expect(creatorRepo.findByProfileId).toHaveBeenCalledWith('profile-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(creatorRepo.findByProfileId).mockResolvedValue(null);

      const result = await useCases.getCreatorProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── createCreatorProfile ───
  describe('createCreatorProfile', () => {
    it('creates creator profile with correct input', async () => {
      const input = {
        profileId: 'profile-1',
        intro: 'AI 영상 전문 크리에이터입니다.',
        skills: ['runway', 'midjourney'],
        tools: ['Runway Gen-3'],
      };
      vi.mocked(creatorRepo.create).mockResolvedValue(mockCreator);

      const result = await useCases.createCreatorProfile(input);

      expect(result).toEqual(mockCreator);
      expect(creatorRepo.create).toHaveBeenCalledWith(input);
    });
  });

  // ─── updateCreatorProfile ───
  describe('updateCreatorProfile', () => {
    it('updates creator profile fields', async () => {
      const updated = { ...mockCreator, intro: '수정된 소개' };
      vi.mocked(creatorRepo.update).mockResolvedValue(updated);

      const result = await useCases.updateCreatorProfile('creator-1', { intro: '수정된 소개' });

      expect(result.intro).toBe('수정된 소개');
      expect(creatorRepo.update).toHaveBeenCalledWith('creator-1', { intro: '수정된 소개' });
    });
  });

  // ─── getPortfolio ───
  describe('getPortfolio', () => {
    it('returns portfolio items for creator', async () => {
      vi.mocked(portfolioRepo.findByCreatorProfileId).mockResolvedValue([mockPortfolioItem, mockPortfolioItem2]);

      const result = await useCases.getPortfolio('creator-1');

      expect(result).toHaveLength(2);
      expect(portfolioRepo.findByCreatorProfileId).toHaveBeenCalledWith('creator-1');
    });

    it('returns empty array when no portfolio items', async () => {
      vi.mocked(portfolioRepo.findByCreatorProfileId).mockResolvedValue([]);

      const result = await useCases.getPortfolio('creator-no-items');

      expect(result).toEqual([]);
    });
  });

  // ─── addPortfolioItem ───
  describe('addPortfolioItem', () => {
    it('creates a new portfolio item', async () => {
      const input = {
        creatorProfileId: 'creator-1',
        title: 'AI 뮤직비디오 샘플',
        fileUrl: 'https://storage.example.com/files/sample.mp4',
        mediaType: 'video' as const,
      };
      vi.mocked(portfolioRepo.create).mockResolvedValue(mockPortfolioItem);

      const result = await useCases.addPortfolioItem(input);

      expect(result).toEqual(mockPortfolioItem);
      expect(portfolioRepo.create).toHaveBeenCalledWith(input);
    });
  });

  // ─── updatePortfolioItem ───
  describe('updatePortfolioItem', () => {
    it('updates portfolio item fields', async () => {
      const updated = { ...mockPortfolioItem, title: '수정된 제목' };
      vi.mocked(portfolioRepo.update).mockResolvedValue(updated);

      const result = await useCases.updatePortfolioItem('item-1', { title: '수정된 제목' });

      expect(result.title).toBe('수정된 제목');
    });
  });

  // ─── removePortfolioItem ───
  describe('removePortfolioItem', () => {
    it('deletes portfolio item', async () => {
      vi.mocked(portfolioRepo.delete).mockResolvedValue();

      await useCases.removePortfolioItem('item-1');

      expect(portfolioRepo.delete).toHaveBeenCalledWith('item-1');
    });
  });

  // ─── getCreatorWithPortfolio ───
  describe('getCreatorWithPortfolio', () => {
    it('returns creator with portfolio items', async () => {
      vi.mocked(creatorRepo.findByProfileId).mockResolvedValue(mockCreator);
      vi.mocked(portfolioRepo.findByCreatorProfileId).mockResolvedValue([mockPortfolioItem]);

      const result = await useCases.getCreatorWithPortfolio('profile-1');

      expect(result).toEqual({
        creator: mockCreator,
        portfolio: [mockPortfolioItem],
      });
      expect(creatorRepo.findByProfileId).toHaveBeenCalledWith('profile-1');
      expect(portfolioRepo.findByCreatorProfileId).toHaveBeenCalledWith('creator-1');
    });

    it('returns null when creator not found', async () => {
      vi.mocked(creatorRepo.findByProfileId).mockResolvedValue(null);

      const result = await useCases.getCreatorWithPortfolio('nonexistent');

      expect(result).toBeNull();
      expect(portfolioRepo.findByCreatorProfileId).not.toHaveBeenCalled();
    });
  });
});
