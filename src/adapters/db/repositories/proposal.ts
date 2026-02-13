import { eq, desc } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { proposals } from '@/adapters/db/schema/interactions';
import type { ProposalRepository } from '@/core/ports/proposal-repository';
import type { ProposalData, CreateProposalInput, UpdateProposalInput } from '@/core/types/proposal';

export const proposalRepository: ProposalRepository = {
  async findById(id: string): Promise<ProposalData | null> {
    const results = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    return results[0] ?? null;
  },

  async findByProjectId(projectId: string): Promise<ProposalData[]> {
    return db.select().from(proposals)
      .where(eq(proposals.projectId, projectId))
      .orderBy(desc(proposals.createdAt));
  },

  async findByCreatorId(creatorId: string): Promise<ProposalData[]> {
    return db.select().from(proposals)
      .where(eq(proposals.creatorId, creatorId))
      .orderBy(desc(proposals.createdAt));
  },

  async create(input: CreateProposalInput): Promise<ProposalData> {
    const [result] = await db.insert(proposals).values({
      projectId: input.projectId,
      creatorId: input.creatorId,
      deliveryDays: input.deliveryDays,
      milestones: input.milestones,
      revisionScope: input.revisionScope,
      price: input.price,
      status: 'pending',
    }).returning();
    if (!result) throw new Error('Failed to create proposal');
    return result;
  },

  async update(id: string, input: UpdateProposalInput): Promise<ProposalData> {
    const [result] = await db.update(proposals)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    if (!result) throw new Error('Proposal not found');
    return result;
  },
};
