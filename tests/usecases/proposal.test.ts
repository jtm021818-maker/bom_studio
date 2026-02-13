import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProposalUseCases } from '@/core/usecases/proposal';
import type { ProposalRepository } from '@/core/ports/proposal-repository';
import type { ProposalData } from '@/core/types/proposal';

// ─── Mock Data ───
const NOW = new Date('2026-02-12T00:00:00Z');

const mockProposal: ProposalData = {
  id: 'prop-1',
  projectId: 'proj-1',
  creatorId: 'creator-1',
  deliveryDays: 14,
  milestones: '1차 스토리보드 → 2차 영상 초안 → 3차 최종 납품',
  revisionScope: '2회 수정 포함',
  price: 500000,
  status: 'pending',
  createdAt: NOW,
};

const mockProposal2: ProposalData = {
  ...mockProposal,
  id: 'prop-2',
  creatorId: 'creator-2',
  price: 750000,
};

// ─── Mock Repository ───
function createMockProposalRepo(): ProposalRepository {
  return {
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    findByCreatorId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

describe('createProposalUseCases', () => {
  let proposalRepo: ReturnType<typeof createMockProposalRepo>;
  let useCases: ReturnType<typeof createProposalUseCases>;

  beforeEach(() => {
    proposalRepo = createMockProposalRepo();
    useCases = createProposalUseCases(proposalRepo);
  });

  // ─── getProposal ───
  describe('getProposal', () => {
    it('returns proposal when found', async () => {
      vi.mocked(proposalRepo.findById).mockResolvedValue(mockProposal);

      const result = await useCases.getProposal('prop-1');

      expect(result).toEqual(mockProposal);
      expect(proposalRepo.findById).toHaveBeenCalledWith('prop-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(proposalRepo.findById).mockResolvedValue(null);

      const result = await useCases.getProposal('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── listByProject ───
  describe('listByProject', () => {
    it('returns all proposals for a project', async () => {
      vi.mocked(proposalRepo.findByProjectId).mockResolvedValue([mockProposal, mockProposal2]);

      const result = await useCases.listByProject('proj-1');

      expect(result).toHaveLength(2);
      expect(proposalRepo.findByProjectId).toHaveBeenCalledWith('proj-1');
    });
  });

  // ─── listByCreator ───
  describe('listByCreator', () => {
    it('returns all proposals by a creator', async () => {
      vi.mocked(proposalRepo.findByCreatorId).mockResolvedValue([mockProposal]);

      const result = await useCases.listByCreator('creator-1');

      expect(result).toHaveLength(1);
      expect(proposalRepo.findByCreatorId).toHaveBeenCalledWith('creator-1');
    });
  });

  // ─── createProposal ───
  describe('createProposal', () => {
    it('creates proposal with valid input', async () => {
      const input = {
        projectId: 'proj-1',
        creatorId: 'creator-1',
        deliveryDays: 14,
        milestones: '단계별 작업',
        revisionScope: '2회',
        price: 500000,
      };
      vi.mocked(proposalRepo.create).mockResolvedValue(mockProposal);

      const result = await useCases.createProposal(input);

      expect(result).toEqual(mockProposal);
      expect(proposalRepo.create).toHaveBeenCalledWith(input);
    });

    it('rejects price below 10000', async () => {
      const input = {
        projectId: 'proj-1',
        creatorId: 'creator-1',
        deliveryDays: 14,
        milestones: '단계별 작업',
        revisionScope: '2회',
        price: 9999,
      };

      await expect(useCases.createProposal(input)).rejects.toThrow('제안 금액은 ₩10,000 이상이어야 합니다.');
      expect(proposalRepo.create).not.toHaveBeenCalled();
    });

    it('accepts price at exactly 10000', async () => {
      const input = {
        projectId: 'proj-1',
        creatorId: 'creator-1',
        deliveryDays: 7,
        milestones: '단순 작업',
        revisionScope: '1회',
        price: 10000,
      };
      vi.mocked(proposalRepo.create).mockResolvedValue({ ...mockProposal, price: 10000 });

      const result = await useCases.createProposal(input);

      expect(result.price).toBe(10000);
    });

    it('rejects deliveryDays below 1', async () => {
      const input = {
        projectId: 'proj-1',
        creatorId: 'creator-1',
        deliveryDays: 0,
        milestones: '단계별 작업',
        revisionScope: '2회',
        price: 500000,
      };

      await expect(useCases.createProposal(input)).rejects.toThrow('납품 기간은 최소 1일 이상이어야 합니다.');
      expect(proposalRepo.create).not.toHaveBeenCalled();
    });

    it('accepts deliveryDays at exactly 1', async () => {
      const input = {
        projectId: 'proj-1',
        creatorId: 'creator-1',
        deliveryDays: 1,
        milestones: '단순',
        revisionScope: '없음',
        price: 50000,
      };
      vi.mocked(proposalRepo.create).mockResolvedValue({ ...mockProposal, deliveryDays: 1 });

      const result = await useCases.createProposal(input);

      expect(result.deliveryDays).toBe(1);
    });
  });

  // ─── acceptProposal ───
  describe('acceptProposal', () => {
    it('sets status to accepted', async () => {
      const accepted = { ...mockProposal, status: 'accepted' as const };
      vi.mocked(proposalRepo.update).mockResolvedValue(accepted);

      const result = await useCases.acceptProposal('prop-1');

      expect(result.status).toBe('accepted');
      expect(proposalRepo.update).toHaveBeenCalledWith('prop-1', { status: 'accepted' });
    });
  });

  // ─── rejectProposal ───
  describe('rejectProposal', () => {
    it('sets status to rejected', async () => {
      const rejected = { ...mockProposal, status: 'rejected' as const };
      vi.mocked(proposalRepo.update).mockResolvedValue(rejected);

      const result = await useCases.rejectProposal('prop-1');

      expect(result.status).toBe('rejected');
      expect(proposalRepo.update).toHaveBeenCalledWith('prop-1', { status: 'rejected' });
    });
  });

  // ─── updateProposal ───
  describe('updateProposal', () => {
    it('updates proposal fields', async () => {
      const updated = { ...mockProposal, price: 600000 };
      vi.mocked(proposalRepo.update).mockResolvedValue(updated);

      const result = await useCases.updateProposal('prop-1', { price: 600000 });

      expect(result.price).toBe(600000);
      expect(proposalRepo.update).toHaveBeenCalledWith('prop-1', { price: 600000 });
    });
  });
});
