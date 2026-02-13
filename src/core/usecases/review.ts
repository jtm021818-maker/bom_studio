import type { ReviewRepository, DisputeRepository } from '@/core/ports/review-repository';
import type { ReviewData, CreateReviewInput, DisputeData, CreateDisputeInput } from '@/core/types/review';

export function createReviewUseCases(reviewRepo: ReviewRepository, disputeRepo: DisputeRepository) {
  return {
    // ─── Reviews ───
    async getProjectReviews(projectId: string): Promise<ReviewData[]> {
      return reviewRepo.findByProjectId(projectId);
    },

    async getCreatorReviews(profileId: string): Promise<ReviewData[]> {
      return reviewRepo.findByRevieweeId(profileId);
    },

    async createReview(input: CreateReviewInput): Promise<ReviewData> {
      if (input.rating < 1 || input.rating > 5) {
        throw new Error('평점은 1~5 사이여야 합니다.');
      }
      if (!input.comment.trim()) {
        throw new Error('리뷰 내용을 입력해주세요.');
      }
      return reviewRepo.create(input);
    },

    // ─── Disputes ───
    async getProjectDisputes(projectId: string): Promise<DisputeData[]> {
      return disputeRepo.findByProjectId(projectId);
    },

    async createDispute(input: CreateDisputeInput): Promise<DisputeData> {
      if (!input.reason.trim()) {
        throw new Error('분쟁 사유를 입력해주세요.');
      }
      return disputeRepo.create(input);
    },

    async investigateDispute(id: string): Promise<DisputeData> {
      return disputeRepo.updateStatus(id, 'investigating');
    },

    async resolveDispute(id: string): Promise<DisputeData> {
      return disputeRepo.updateStatus(id, 'resolved');
    },

    async closeDispute(id: string): Promise<DisputeData> {
      return disputeRepo.updateStatus(id, 'closed');
    },
  };
}
