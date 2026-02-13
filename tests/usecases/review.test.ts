import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReviewUseCases } from '@/core/usecases/review';
import type { ReviewRepository, DisputeRepository } from '@/core/ports/review-repository';
import type { ReviewData, DisputeData } from '@/core/types/review';

// ─── Mock Data ───
const NOW = new Date('2026-02-12T00:00:00Z');

const mockReview: ReviewData = {
  id: 'rev-1',
  projectId: 'proj-1',
  reviewerId: 'user-1',
  revieweeId: 'creator-1',
  rating: 5,
  comment: '매우 만족스러운 결과물이었습니다. AI 영상 퀄리티가 훌륭합니다.',
  createdAt: NOW,
};

const mockReview2: ReviewData = {
  ...mockReview,
  id: 'rev-2',
  reviewerId: 'creator-1',
  revieweeId: 'user-1',
  rating: 4,
  comment: '원활한 커뮤니케이션이었습니다.',
};

const mockDispute: DisputeData = {
  id: 'disp-1',
  projectId: 'proj-1',
  raisedBy: 'user-1',
  reason: '영상 퀄리티가 계약과 다릅니다.',
  evidence: ['https://storage.example.com/evidence1.png'],
  status: 'open',
  createdAt: NOW,
};

// ─── Mock Repositories ───
function createMockReviewRepo(): ReviewRepository {
  return {
    findByProjectId: vi.fn(),
    findByRevieweeId: vi.fn(),
    create: vi.fn(),
  };
}

function createMockDisputeRepo(): DisputeRepository {
  return {
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  };
}

describe('createReviewUseCases', () => {
  let reviewRepo: ReturnType<typeof createMockReviewRepo>;
  let disputeRepo: ReturnType<typeof createMockDisputeRepo>;
  let useCases: ReturnType<typeof createReviewUseCases>;

  beforeEach(() => {
    reviewRepo = createMockReviewRepo();
    disputeRepo = createMockDisputeRepo();
    useCases = createReviewUseCases(reviewRepo, disputeRepo);
  });

  // ─── getProjectReviews ───
  describe('getProjectReviews', () => {
    it('returns reviews for a project', async () => {
      vi.mocked(reviewRepo.findByProjectId).mockResolvedValue([mockReview, mockReview2]);

      const result = await useCases.getProjectReviews('proj-1');

      expect(result).toHaveLength(2);
      expect(reviewRepo.findByProjectId).toHaveBeenCalledWith('proj-1');
    });
  });

  // ─── getCreatorReviews ───
  describe('getCreatorReviews', () => {
    it('returns reviews for a creator', async () => {
      vi.mocked(reviewRepo.findByRevieweeId).mockResolvedValue([mockReview]);

      const result = await useCases.getCreatorReviews('creator-1');

      expect(result).toHaveLength(1);
      expect(reviewRepo.findByRevieweeId).toHaveBeenCalledWith('creator-1');
    });
  });

  // ─── createReview ───
  describe('createReview', () => {
    it('creates review with valid input', async () => {
      const input = {
        projectId: 'proj-1',
        reviewerId: 'user-1',
        revieweeId: 'creator-1',
        rating: 5,
        comment: '훌륭한 결과물입니다.',
      };
      vi.mocked(reviewRepo.create).mockResolvedValue(mockReview);

      const result = await useCases.createReview(input);

      expect(result).toEqual(mockReview);
      expect(reviewRepo.create).toHaveBeenCalledWith(input);
    });

    it('rejects rating below 1', async () => {
      const input = {
        projectId: 'proj-1',
        reviewerId: 'user-1',
        revieweeId: 'creator-1',
        rating: 0,
        comment: '평가합니다.',
      };

      await expect(useCases.createReview(input)).rejects.toThrow('평점은 1~5 사이여야 합니다.');
      expect(reviewRepo.create).not.toHaveBeenCalled();
    });

    it('rejects rating above 5', async () => {
      const input = {
        projectId: 'proj-1',
        reviewerId: 'user-1',
        revieweeId: 'creator-1',
        rating: 6,
        comment: '평가합니다.',
      };

      await expect(useCases.createReview(input)).rejects.toThrow('평점은 1~5 사이여야 합니다.');
    });

    it('accepts rating at boundary values (1 and 5)', async () => {
      vi.mocked(reviewRepo.create).mockResolvedValue({ ...mockReview, rating: 1 });
      const result1 = await useCases.createReview({
        projectId: 'proj-1', reviewerId: 'u1', revieweeId: 'c1', rating: 1, comment: '별로',
      });
      expect(result1.rating).toBe(1);

      vi.mocked(reviewRepo.create).mockResolvedValue({ ...mockReview, rating: 5 });
      const result5 = await useCases.createReview({
        projectId: 'proj-1', reviewerId: 'u1', revieweeId: 'c1', rating: 5, comment: '최고',
      });
      expect(result5.rating).toBe(5);
    });

    it('rejects empty comment', async () => {
      const input = {
        projectId: 'proj-1',
        reviewerId: 'user-1',
        revieweeId: 'creator-1',
        rating: 3,
        comment: '   ',
      };

      await expect(useCases.createReview(input)).rejects.toThrow('리뷰 내용을 입력해주세요.');
    });
  });

  // ─── getProjectDisputes ───
  describe('getProjectDisputes', () => {
    it('returns disputes for a project', async () => {
      vi.mocked(disputeRepo.findByProjectId).mockResolvedValue([mockDispute]);

      const result = await useCases.getProjectDisputes('proj-1');

      expect(result).toHaveLength(1);
      expect(disputeRepo.findByProjectId).toHaveBeenCalledWith('proj-1');
    });
  });

  // ─── createDispute ───
  describe('createDispute', () => {
    it('creates dispute with valid input', async () => {
      const input = {
        projectId: 'proj-1',
        raisedBy: 'user-1',
        reason: '영상 퀄리티가 계약과 다릅니다.',
        evidence: ['https://storage.example.com/evidence1.png'],
      };
      vi.mocked(disputeRepo.create).mockResolvedValue(mockDispute);

      const result = await useCases.createDispute(input);

      expect(result).toEqual(mockDispute);
      expect(disputeRepo.create).toHaveBeenCalledWith(input);
    });

    it('rejects empty reason', async () => {
      const input = {
        projectId: 'proj-1',
        raisedBy: 'user-1',
        reason: '   ',
      };

      await expect(useCases.createDispute(input)).rejects.toThrow('분쟁 사유를 입력해주세요.');
      expect(disputeRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─── investigateDispute ───
  describe('investigateDispute', () => {
    it('sets status to investigating', async () => {
      const investigating = { ...mockDispute, status: 'investigating' as const };
      vi.mocked(disputeRepo.updateStatus).mockResolvedValue(investigating);

      const result = await useCases.investigateDispute('disp-1');

      expect(result.status).toBe('investigating');
      expect(disputeRepo.updateStatus).toHaveBeenCalledWith('disp-1', 'investigating');
    });
  });

  // ─── resolveDispute ───
  describe('resolveDispute', () => {
    it('sets status to resolved', async () => {
      const resolved = { ...mockDispute, status: 'resolved' as const };
      vi.mocked(disputeRepo.updateStatus).mockResolvedValue(resolved);

      const result = await useCases.resolveDispute('disp-1');

      expect(result.status).toBe('resolved');
      expect(disputeRepo.updateStatus).toHaveBeenCalledWith('disp-1', 'resolved');
    });
  });

  // ─── closeDispute ───
  describe('closeDispute', () => {
    it('sets status to closed', async () => {
      const closed = { ...mockDispute, status: 'closed' as const };
      vi.mocked(disputeRepo.updateStatus).mockResolvedValue(closed);

      const result = await useCases.closeDispute('disp-1');

      expect(result.status).toBe('closed');
      expect(disputeRepo.updateStatus).toHaveBeenCalledWith('disp-1', 'closed');
    });
  });
});
