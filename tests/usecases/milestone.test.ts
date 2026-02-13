import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMilestoneUseCases } from '@/core/usecases/milestone';
import type { MilestoneRepository, DeliveryRepository } from '@/core/ports/milestone-repository';
import type { MilestoneData, DeliveryData } from '@/core/types/milestone';

// ─── Mock Data ───
const NOW = new Date('2026-02-12T00:00:00Z');
const DUE = new Date('2026-03-01T00:00:00Z');

const mockMilestone: MilestoneData = {
  id: 'ms-1',
  projectId: 'proj-1',
  title: '1차 스토리보드 납품',
  description: '스토리보드 초안 작성 및 클라이언트 확인',
  amount: 200000,
  dueDate: DUE,
  status: 'pending',
  createdAt: NOW,
};

const mockMilestone2: MilestoneData = {
  ...mockMilestone,
  id: 'ms-2',
  title: '2차 영상 초안',
  amount: 300000,
  dueDate: new Date('2026-03-15T00:00:00Z'),
};

const mockDelivery: DeliveryData = {
  id: 'del-1',
  milestoneId: 'ms-1',
  fileUrl: 'https://storage.example.com/files/delivery1.mp4',
  hasWatermark: true,
  submittedAt: NOW,
  createdAt: NOW,
};

// ─── Mock Repositories ───
function createMockMilestoneRepo(): MilestoneRepository {
  return {
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

function createMockDeliveryRepo(): DeliveryRepository {
  return {
    findByMilestoneId: vi.fn(),
    create: vi.fn(),
  };
}

describe('createMilestoneUseCases', () => {
  let milestoneRepo: ReturnType<typeof createMockMilestoneRepo>;
  let deliveryRepo: ReturnType<typeof createMockDeliveryRepo>;
  let useCases: ReturnType<typeof createMilestoneUseCases>;

  beforeEach(() => {
    milestoneRepo = createMockMilestoneRepo();
    deliveryRepo = createMockDeliveryRepo();
    useCases = createMilestoneUseCases(milestoneRepo, deliveryRepo);
  });

  // ─── getMilestone ───
  describe('getMilestone', () => {
    it('returns milestone when found', async () => {
      vi.mocked(milestoneRepo.findById).mockResolvedValue(mockMilestone);

      const result = await useCases.getMilestone('ms-1');

      expect(result).toEqual(mockMilestone);
      expect(milestoneRepo.findById).toHaveBeenCalledWith('ms-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(milestoneRepo.findById).mockResolvedValue(null);

      const result = await useCases.getMilestone('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── listByProject ───
  describe('listByProject', () => {
    it('returns milestones for a project', async () => {
      vi.mocked(milestoneRepo.findByProjectId).mockResolvedValue([mockMilestone, mockMilestone2]);

      const result = await useCases.listByProject('proj-1');

      expect(result).toHaveLength(2);
      expect(milestoneRepo.findByProjectId).toHaveBeenCalledWith('proj-1');
    });
  });

  // ─── createMilestone ───
  describe('createMilestone', () => {
    it('creates milestone with valid input', async () => {
      const input = {
        projectId: 'proj-1',
        title: '1차 스토리보드 납품',
        description: '스토리보드 초안',
        amount: 200000,
        dueDate: DUE,
      };
      vi.mocked(milestoneRepo.create).mockResolvedValue(mockMilestone);

      const result = await useCases.createMilestone(input);

      expect(result).toEqual(mockMilestone);
      expect(milestoneRepo.create).toHaveBeenCalledWith(input);
    });

    it('rejects negative amount', async () => {
      const input = {
        projectId: 'proj-1',
        title: '잘못된 마일스톤',
        description: '음수 금액',
        amount: -1,
        dueDate: DUE,
      };

      await expect(useCases.createMilestone(input)).rejects.toThrow('금액은 0 이상이어야 합니다.');
      expect(milestoneRepo.create).not.toHaveBeenCalled();
    });

    it('accepts zero amount', async () => {
      const input = {
        projectId: 'proj-1',
        title: '무료 마일스톤',
        description: '무료',
        amount: 0,
        dueDate: DUE,
      };
      vi.mocked(milestoneRepo.create).mockResolvedValue({ ...mockMilestone, amount: 0 });

      const result = await useCases.createMilestone(input);

      expect(result.amount).toBe(0);
    });
  });

  // ─── updateMilestone ───
  describe('updateMilestone', () => {
    it('updates milestone fields', async () => {
      const updated = { ...mockMilestone, title: '수정된 마일스톤' };
      vi.mocked(milestoneRepo.update).mockResolvedValue(updated);

      const result = await useCases.updateMilestone('ms-1', { title: '수정된 마일스톤' });

      expect(result.title).toBe('수정된 마일스톤');
    });
  });

  // ─── submitMilestone ───
  describe('submitMilestone', () => {
    it('sets status to submitted', async () => {
      const submitted = { ...mockMilestone, status: 'submitted' as const };
      vi.mocked(milestoneRepo.update).mockResolvedValue(submitted);

      const result = await useCases.submitMilestone('ms-1');

      expect(result.status).toBe('submitted');
      expect(milestoneRepo.update).toHaveBeenCalledWith('ms-1', { status: 'submitted' });
    });
  });

  // ─── approveMilestone ───
  describe('approveMilestone', () => {
    it('sets status to approved', async () => {
      const approved = { ...mockMilestone, status: 'approved' as const };
      vi.mocked(milestoneRepo.update).mockResolvedValue(approved);

      const result = await useCases.approveMilestone('ms-1');

      expect(result.status).toBe('approved');
      expect(milestoneRepo.update).toHaveBeenCalledWith('ms-1', { status: 'approved' });
    });
  });

  // ─── requestRevision ───
  describe('requestRevision', () => {
    it('sets status to revision_requested', async () => {
      const revision = { ...mockMilestone, status: 'revision_requested' as const };
      vi.mocked(milestoneRepo.update).mockResolvedValue(revision);

      const result = await useCases.requestRevision('ms-1');

      expect(result.status).toBe('revision_requested');
      expect(milestoneRepo.update).toHaveBeenCalledWith('ms-1', { status: 'revision_requested' });
    });
  });

  // ─── completeMilestone ───
  describe('completeMilestone', () => {
    it('sets status to completed', async () => {
      const completed = { ...mockMilestone, status: 'completed' as const };
      vi.mocked(milestoneRepo.update).mockResolvedValue(completed);

      const result = await useCases.completeMilestone('ms-1');

      expect(result.status).toBe('completed');
      expect(milestoneRepo.update).toHaveBeenCalledWith('ms-1', { status: 'completed' });
    });
  });

  // ─── getDeliveries ───
  describe('getDeliveries', () => {
    it('returns deliveries for a milestone', async () => {
      vi.mocked(deliveryRepo.findByMilestoneId).mockResolvedValue([mockDelivery]);

      const result = await useCases.getDeliveries('ms-1');

      expect(result).toHaveLength(1);
      expect(deliveryRepo.findByMilestoneId).toHaveBeenCalledWith('ms-1');
    });
  });

  // ─── submitDelivery ───
  describe('submitDelivery', () => {
    it('creates delivery and auto-updates milestone status', async () => {
      const input = {
        milestoneId: 'ms-1',
        fileUrl: 'https://storage.example.com/files/delivery1.mp4',
      };
      vi.mocked(deliveryRepo.create).mockResolvedValue(mockDelivery);
      vi.mocked(milestoneRepo.update).mockResolvedValue({
        ...mockMilestone,
        status: 'submitted',
      });

      const result = await useCases.submitDelivery(input);

      expect(result).toEqual(mockDelivery);
      expect(deliveryRepo.create).toHaveBeenCalledWith(input);
      expect(milestoneRepo.update).toHaveBeenCalledWith('ms-1', { status: 'submitted' });
    });
  });
});
