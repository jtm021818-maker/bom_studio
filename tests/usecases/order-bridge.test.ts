import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderBridge } from '@/core/usecases/order-bridge';
import type { OrderRepository } from '@/core/ports/order-repository';
import type { ProjectRepository } from '@/core/ports/project-repository';
import type { ProposalRepository } from '@/core/ports/proposal-repository';
import type { MilestoneRepository } from '@/core/ports/milestone-repository';
import type { ServiceRepository } from '@/core/ports/service-repository';
import type { OrderData } from '@/core/types/order';
import type { ServiceData } from '@/core/types/service';

// ─── Mock data ───

const mockService: ServiceData = {
  id: 'service-1',
  creatorId: 'creator-1',
  title: 'AI 숏폼 영상 제작',
  description: '프리미엄 AI 숏폼 영상을 제작합니다.',
  category: 'short_form',
  status: 'active',
  packages: [
    {
      tier: 'basic',
      title: 'Basic',
      description: '기본 패키지',
      price: 50000,
      deliveryDays: 3,
      revisions: 1,
      videoLength: '30초',
      features: ['기본 편집'],
    },
    {
      tier: 'standard',
      title: 'Standard',
      description: '스탠다드 패키지',
      price: 120000,
      deliveryDays: 5,
      revisions: 2,
      videoLength: '60초',
      features: ['기본 편집', '자막 포함'],
    },
    {
      tier: 'premium',
      title: 'Premium',
      description: '프리미엄 패키지',
      price: 250000,
      deliveryDays: 7,
      revisions: 3,
      videoLength: '120초',
      features: ['기본 편집', '자막 포함', 'BGM'],
    },
  ],
  thumbnailUrl: '',
  galleryUrls: [],
  tags: ['AI', '숏폼'],
  faq: [],
  viewCount: 100,
  orderCount: 10,
  avgRating: 4.8,
  reviewCount: 5,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockOrder: OrderData = {
  id: 'order-1',
  serviceId: 'service-1',
  buyerId: 'buyer-1',
  creatorId: 'creator-1',
  packageTier: 'standard',
  price: 120000,
  commissionRate: 0.12,
  commissionAmount: 14400,
  sellerReceives: 105600,
  status: 'paid',
  requirements: '사이버펑크 분위기로 제작해주세요.',
  projectId: null,
  paymentKey: 'pay_123',
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
};

// ─── Mock repositories ───

function createMockRepos() {
  const orderRepo: OrderRepository = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockOrder),
    findByBuyerId: vi.fn(),
    findByCreatorId: vi.fn(),
    findByServiceId: vi.fn(),
    update: vi.fn().mockImplementation(async (id, input) => ({
      ...mockOrder,
      ...input,
      id,
    })),
  };

  const projectRepo: ProjectRepository = {
    create: vi.fn().mockResolvedValue({
      id: 'project-1',
      clientId: 'buyer-1',
      title: '[서비스 주문] AI 숏폼 영상 제작',
      description: 'test',
      status: 'draft',
      budgetMin: 120000,
      budgetMax: 120000,
      deadline: new Date(),
      category: 'short_form',
      createdAt: new Date(),
    }),
    findById: vi.fn(),
    findByClientId: vi.fn(),
    findOpen: vi.fn(),
    update: vi.fn().mockResolvedValue({
      id: 'project-1',
      status: 'in_progress',
    }),
  };

  const proposalRepo: ProposalRepository = {
    create: vi.fn().mockResolvedValue({
      id: 'proposal-1',
      projectId: 'project-1',
      creatorId: 'creator-1',
      deliveryDays: 5,
      milestones: 'test',
      revisionScope: 'test',
      price: 120000,
      status: 'pending',
      createdAt: new Date(),
    }),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    findByCreatorId: vi.fn(),
    update: vi.fn(),
  };

  const milestoneRepo: MilestoneRepository = {
    create: vi.fn().mockImplementation(async (input) => ({
      id: `ms-${Math.random().toString(36).slice(2)}`,
      ...input,
      status: 'pending',
      createdAt: new Date(),
    })),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    update: vi.fn(),
  };

  const serviceRepo: ServiceRepository = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockService),
    findByCreatorId: vi.fn(),
    findByCategory: vi.fn(),
    findFeatured: vi.fn(),
    update: vi.fn(),
    updateStats: vi.fn(),
  };

  return { orderRepo, projectRepo, proposalRepo, milestoneRepo, serviceRepo };
}

// ─── Tests ───

describe('Order Bridge', () => {
  let repos: ReturnType<typeof createMockRepos>;
  let bridge: ReturnType<typeof createOrderBridge>;

  beforeEach(() => {
    repos = createMockRepos();
    bridge = createOrderBridge(repos);
  });

  describe('processOrder', () => {
    it('should create project from paid order', async () => {
      const result = await bridge.processOrder('order-1');

      expect(repos.projectRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'buyer-1',
          title: expect.stringContaining('AI 숏폼 영상 제작'),
          category: 'short_form',
          budgetMin: 120000,
          budgetMax: 120000,
        }),
      );

      expect(result.status).toBe('project_created');
      expect(result.projectId).toBe('project-1');
    });

    it('should set project status to in_progress', async () => {
      await bridge.processOrder('order-1');

      expect(repos.projectRepo.update).toHaveBeenCalledWith('project-1', { status: 'in_progress' });
    });

    it('should create accepted proposal', async () => {
      await bridge.processOrder('order-1');

      expect(repos.proposalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          creatorId: 'creator-1',
          deliveryDays: 5,
          price: 120000,
        }),
      );
    });

    it('should create 2 milestones (1차 시안 + 최종 납품)', async () => {
      await bridge.processOrder('order-1');

      expect(repos.milestoneRepo.create).toHaveBeenCalledTimes(2);

      const calls = vi.mocked(repos.milestoneRepo.create).mock.calls;
      expect(calls.length).toBe(2);

      // First milestone: 1차 시안
      expect(calls[0]![0]).toEqual(
        expect.objectContaining({
          projectId: 'project-1',
          title: '1차 시안',
        }),
      );

      // Second milestone: 최종 납품
      expect(calls[1]![0]).toEqual(
        expect.objectContaining({
          projectId: 'project-1',
          title: '최종 납품',
        }),
      );
    });

    it('should split seller amount between milestones', async () => {
      await bridge.processOrder('order-1');

      const calls = vi.mocked(repos.milestoneRepo.create).mock.calls;
      expect(calls.length).toBe(2);
      const firstAmount = calls[0]![0].amount;
      const secondAmount = calls[1]![0].amount;

      // Total should equal sellerReceives (105600)
      expect(firstAmount + secondAmount).toBe(mockOrder.sellerReceives);
      // First should be ~half
      expect(firstAmount).toBe(Math.floor(105600 / 2));
    });

    it('should include requirements in project description', async () => {
      await bridge.processOrder('order-1');

      expect(repos.projectRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('사이버펑크 분위기로 제작해주세요.'),
        }),
      );
    });

    it('should throw for non-paid orders', async () => {
      vi.mocked(repos.orderRepo.findById).mockResolvedValue({
        ...mockOrder,
        status: 'pending',
      });

      await expect(bridge.processOrder('order-1')).rejects.toThrow('결제 완료된 주문만 처리할 수 있습니다.');
    });

    it('should throw for non-existent orders', async () => {
      vi.mocked(repos.orderRepo.findById).mockResolvedValue(null);

      await expect(bridge.processOrder('order-1')).rejects.toThrow('주문을 찾을 수 없습니다.');
    });

    it('should throw for non-existent services', async () => {
      vi.mocked(repos.serviceRepo.findById).mockResolvedValue(null);

      await expect(bridge.processOrder('order-1')).rejects.toThrow('서비스를 찾을 수 없습니다.');
    });

    it('should handle basic package correctly', async () => {
      vi.mocked(repos.orderRepo.findById).mockResolvedValue({
        ...mockOrder,
        packageTier: 'basic',
        price: 50000,
        commissionRate: 0.15,
        commissionAmount: 7500,
        sellerReceives: 42500,
      });

      await bridge.processOrder('order-1');

      const calls = vi.mocked(repos.milestoneRepo.create).mock.calls;
      expect(calls.length).toBe(2);
      const total = calls[0]![0].amount + calls[1]![0].amount;
      expect(total).toBe(42500);
    });

    it('should handle premium package with correct delivery days', async () => {
      vi.mocked(repos.orderRepo.findById).mockResolvedValue({
        ...mockOrder,
        packageTier: 'premium',
        price: 250000,
      });

      await bridge.processOrder('order-1');

      // Premium package has deliveryDays=7
      expect(repos.projectRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deadline: expect.any(Date),
        }),
      );

      const createCall = vi.mocked(repos.projectRepo.create).mock.calls[0]![0];
      const deadlineDiff = createCall.deadline.getTime() - Date.now();
      const daysDiff = Math.round(deadlineDiff / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(6); // ~7 days, allow for timing
      expect(daysDiff).toBeLessThanOrEqual(8);
    });
  });
});
