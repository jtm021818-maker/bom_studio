import { eq, desc } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { reviews, disputes } from '@/adapters/db/schema/feedback';
import type { ReviewRepository, DisputeRepository } from '@/core/ports/review-repository';
import type { ReviewData, CreateReviewInput, DisputeData, CreateDisputeInput, DisputeStatus } from '@/core/types/review';

export const reviewRepository: ReviewRepository = {
  async findByProjectId(projectId: string): Promise<ReviewData[]> {
    return db.select().from(reviews)
      .where(eq(reviews.projectId, projectId))
      .orderBy(desc(reviews.createdAt));
  },

  async findByRevieweeId(revieweeId: string): Promise<ReviewData[]> {
    return db.select().from(reviews)
      .where(eq(reviews.revieweeId, revieweeId))
      .orderBy(desc(reviews.createdAt));
  },

  async create(input: CreateReviewInput): Promise<ReviewData> {
    const [result] = await db.insert(reviews).values({
      projectId: input.projectId,
      reviewerId: input.reviewerId,
      revieweeId: input.revieweeId,
      rating: input.rating,
      comment: input.comment,
    }).returning();
    if (!result) throw new Error('Failed to create review');
    return result;
  },
};

export const disputeRepository: DisputeRepository = {
  async findById(id: string): Promise<DisputeData | null> {
    const results = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    return results[0] ?? null;
  },

  async findByProjectId(projectId: string): Promise<DisputeData[]> {
    return db.select().from(disputes)
      .where(eq(disputes.projectId, projectId))
      .orderBy(desc(disputes.createdAt));
  },

  async create(input: CreateDisputeInput): Promise<DisputeData> {
    const [result] = await db.insert(disputes).values({
      projectId: input.projectId,
      raisedBy: input.raisedBy,
      reason: input.reason,
      evidence: input.evidence ?? null,
      status: 'open',
    }).returning();
    if (!result) throw new Error('Failed to create dispute');
    return result;
  },

  async updateStatus(id: string, status: DisputeStatus): Promise<DisputeData> {
    const [result] = await db.update(disputes)
      .set({ status, updatedAt: new Date() })
      .where(eq(disputes.id, id))
      .returning();
    if (!result) throw new Error('Dispute not found');
    return result;
  },
};
