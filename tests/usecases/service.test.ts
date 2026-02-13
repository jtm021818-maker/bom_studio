import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServiceUseCases } from '@/core/usecases/service';
import type { ServiceRepository } from '@/core/ports/service-repository';
import type { ServiceData } from '@/core/types/service';

// ─── Mock Data ───
const NOW = new Date('2026-02-12T00:00:00Z');

const mockPackages = [
  {
    tier: 'basic' as const,
    title: 'Basic',
    description: '기본 패키지',
    price: 50000,
    deliveryDays: 7,
    revisions: 1,
    videoLength: '30초',
    features: ['기본 편집'],
  },
  {
    tier: 'standard' as const,
    title: 'Standard',
    description: '스탠다드 패키지',
    price: 120000,
    deliveryDays: 5,
    revisions: 3,
    videoLength: '1분',
    features: ['기본 편집', '자막 포함'],
  },
  {
    tier: 'premium' as const,
    title: 'Premium',
    description: '프리미엄 패키지',
    price: 250000,
    deliveryDays: 3,
    revisions: 5,
    videoLength: '3분',
    features: ['기본 편집', '자막 포함', 'BGM 포함', '썸네일 제작'],
  },
];

const mockService: ServiceData = {
  id: 'svc-1',
  creatorId: 'creator-1',
  title: 'AI 숏폼 영상 제작',
  description: '고퀄리티 AI 숏폼 영상을 제작해드립니다. 다양한 스타일로 제작 가능합니다.',
  category: 'short_form',
  status: 'active',
  packages: mockPackages,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  galleryUrls: ['https://example.com/gallery1.jpg'],
  tags: ['AI', '숏폼', '영상제작'],
  faq: [{ question: '수정은 몇 번 가능한가요?', answer: '패키지별 수정 횟수가 다릅니다.' }],
  viewCount: 150,
  orderCount: 23,
  avgRating: 4.8,
  reviewCount: 18,
  createdAt: NOW,
  updatedAt: NOW,
};

const mockDraftService: ServiceData = {
  ...mockService,
  id: 'svc-2',
  status: 'draft',
  title: '뮤직비디오 AI 제작',
  category: 'music_video',
};

// ─── Mock Repository ───
function createMockServiceRepo(): ServiceRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByCreatorId: vi.fn(),
    findByCategory: vi.fn(),
    findFeatured: vi.fn(),
    update: vi.fn(),
    updateStats: vi.fn(),
  };
}

describe('createServiceUseCases', () => {
  let serviceRepo: ReturnType<typeof createMockServiceRepo>;
  let useCases: ReturnType<typeof createServiceUseCases>;

  beforeEach(() => {
    serviceRepo = createMockServiceRepo();
    useCases = createServiceUseCases(serviceRepo);
  });

  // ─── getService ───
  describe('getService', () => {
    it('returns service when found', async () => {
      vi.mocked(serviceRepo.findById).mockResolvedValue(mockService);

      const result = await useCases.getService('svc-1');

      expect(result).toEqual(mockService);
      expect(serviceRepo.findById).toHaveBeenCalledWith('svc-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(serviceRepo.findById).mockResolvedValue(null);

      const result = await useCases.getService('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── createService ───
  describe('createService', () => {
    it('creates service with correct input', async () => {
      const input = {
        creatorId: 'creator-1',
        title: 'AI 숏폼 영상 제작',
        description: '고퀄리티 AI 숏폼 영상을 제작해드립니다. 다양한 스타일로 제작 가능합니다.',
        category: 'short_form',
        packages: mockPackages,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        tags: ['AI', '숏폼'],
      };
      vi.mocked(serviceRepo.create).mockResolvedValue(mockService);

      const result = await useCases.createService(input);

      expect(result).toEqual(mockService);
      expect(serviceRepo.create).toHaveBeenCalledWith(input);
    });

    it('propagates repository errors', async () => {
      vi.mocked(serviceRepo.create).mockRejectedValue(new Error('DB error'));

      await expect(
        useCases.createService({
          creatorId: 'creator-1',
          title: 'Test Service',
          description: '테스트 서비스 설명입니다. 20자 이상 필요합니다.',
          category: 'other',
          packages: mockPackages,
        }),
      ).rejects.toThrow('DB error');
    });
  });

  // ─── listCreatorServices ───
  describe('listCreatorServices', () => {
    it('returns all services for a creator', async () => {
      vi.mocked(serviceRepo.findByCreatorId).mockResolvedValue([mockService, mockDraftService]);

      const result = await useCases.listCreatorServices('creator-1');

      expect(result).toHaveLength(2);
      expect(serviceRepo.findByCreatorId).toHaveBeenCalledWith('creator-1');
    });

    it('returns empty array when creator has no services', async () => {
      vi.mocked(serviceRepo.findByCreatorId).mockResolvedValue([]);

      const result = await useCases.listCreatorServices('creator-no-services');

      expect(result).toEqual([]);
    });
  });

  // ─── listServicesByCategory ───
  describe('listServicesByCategory', () => {
    it('returns paginated results', async () => {
      const paginatedResult = { services: [mockService], total: 1 };
      vi.mocked(serviceRepo.findByCategory).mockResolvedValue(paginatedResult);

      const result = await useCases.listServicesByCategory(
        'short_form',
        { minRating: 4.0 },
        { field: 'orderCount', direction: 'desc' },
        { page: 1, limit: 20 },
      );

      expect(result.services).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(serviceRepo.findByCategory).toHaveBeenCalledWith(
        'short_form',
        { minRating: 4.0 },
        { field: 'orderCount', direction: 'desc' },
        { page: 1, limit: 20 },
      );
    });
  });

  // ─── listFeaturedServices ───
  describe('listFeaturedServices', () => {
    it('returns featured services with default limit', async () => {
      vi.mocked(serviceRepo.findFeatured).mockResolvedValue([mockService]);

      const result = await useCases.listFeaturedServices();

      expect(result).toHaveLength(1);
      expect(serviceRepo.findFeatured).toHaveBeenCalledWith(undefined);
    });

    it('respects custom limit parameter', async () => {
      vi.mocked(serviceRepo.findFeatured).mockResolvedValue([]);

      await useCases.listFeaturedServices(4);

      expect(serviceRepo.findFeatured).toHaveBeenCalledWith(4);
    });
  });

  // ─── updateService ───
  describe('updateService', () => {
    it('updates service fields', async () => {
      const updated = { ...mockService, title: '수정된 서비스 제목' };
      vi.mocked(serviceRepo.update).mockResolvedValue(updated);

      const result = await useCases.updateService('svc-1', { title: '수정된 서비스 제목' });

      expect(result.title).toBe('수정된 서비스 제목');
      expect(serviceRepo.update).toHaveBeenCalledWith('svc-1', { title: '수정된 서비스 제목' });
    });
  });

  // ─── pauseService ───
  describe('pauseService', () => {
    it('sets status to paused', async () => {
      const paused = { ...mockService, status: 'paused' as const };
      vi.mocked(serviceRepo.update).mockResolvedValue(paused);

      const result = await useCases.pauseService('svc-1');

      expect(result.status).toBe('paused');
      expect(serviceRepo.update).toHaveBeenCalledWith('svc-1', { status: 'paused' });
    });
  });

  // ─── activateService ───
  describe('activateService', () => {
    it('sets status to active', async () => {
      const activated = { ...mockDraftService, status: 'active' as const };
      vi.mocked(serviceRepo.update).mockResolvedValue(activated);

      const result = await useCases.activateService('svc-2');

      expect(result.status).toBe('active');
      expect(serviceRepo.update).toHaveBeenCalledWith('svc-2', { status: 'active' });
    });
  });

  // ─── deleteService ───
  describe('deleteService', () => {
    it('sets status to deleted (soft delete)', async () => {
      const deleted = { ...mockService, status: 'deleted' as const };
      vi.mocked(serviceRepo.update).mockResolvedValue(deleted);

      const result = await useCases.deleteService('svc-1');

      expect(result.status).toBe('deleted');
      expect(serviceRepo.update).toHaveBeenCalledWith('svc-1', { status: 'deleted' });
    });
  });

  // ─── incrementViewCount ───
  describe('incrementViewCount', () => {
    it('calls updateStats with viewCount', async () => {
      vi.mocked(serviceRepo.updateStats).mockResolvedValue(undefined);

      await useCases.incrementViewCount('svc-1');

      expect(serviceRepo.updateStats).toHaveBeenCalledWith('svc-1', 'viewCount', 1);
    });
  });

  // ─── incrementOrderCount ───
  describe('incrementOrderCount', () => {
    it('calls updateStats with orderCount', async () => {
      vi.mocked(serviceRepo.updateStats).mockResolvedValue(undefined);

      await useCases.incrementOrderCount('svc-1');

      expect(serviceRepo.updateStats).toHaveBeenCalledWith('svc-1', 'orderCount', 1);
    });
  });
});
