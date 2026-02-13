import type { ReviewData, CreateReviewInput, DisputeData, CreateDisputeInput, DisputeStatus } from '@/core/types/review';

export interface ReviewRepository {
  findByProjectId(projectId: string): Promise<ReviewData[]>;
  findByRevieweeId(revieweeId: string): Promise<ReviewData[]>;
  create(input: CreateReviewInput): Promise<ReviewData>;
}

export interface DisputeRepository {
  findById(id: string): Promise<DisputeData | null>;
  findByProjectId(projectId: string): Promise<DisputeData[]>;
  create(input: CreateDisputeInput): Promise<DisputeData>;
  updateStatus(id: string, status: DisputeStatus): Promise<DisputeData>;
}
