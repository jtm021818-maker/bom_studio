import { eq, asc } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { milestones, deliveries } from '@/adapters/db/schema/interactions';
import type { MilestoneRepository, DeliveryRepository } from '@/core/ports/milestone-repository';
import type { MilestoneData, CreateMilestoneInput, UpdateMilestoneInput, DeliveryData, CreateDeliveryInput } from '@/core/types/milestone';

export const milestoneRepository: MilestoneRepository = {
  async findById(id: string): Promise<MilestoneData | null> {
    const results = await db.select().from(milestones).where(eq(milestones.id, id)).limit(1);
    return results[0] ?? null;
  },

  async findByProjectId(projectId: string): Promise<MilestoneData[]> {
    return db.select().from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(asc(milestones.dueDate));
  },

  async create(input: CreateMilestoneInput): Promise<MilestoneData> {
    const [result] = await db.insert(milestones).values({
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      amount: input.amount,
      dueDate: input.dueDate,
      status: 'pending',
    }).returning();
    if (!result) throw new Error('Failed to create milestone');
    return result;
  },

  async update(id: string, input: UpdateMilestoneInput): Promise<MilestoneData> {
    const [result] = await db.update(milestones)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(milestones.id, id))
      .returning();
    if (!result) throw new Error('Milestone not found');
    return result;
  },
};

export const deliveryRepository: DeliveryRepository = {
  async findByMilestoneId(milestoneId: string): Promise<DeliveryData[]> {
    return db.select().from(deliveries)
      .where(eq(deliveries.milestoneId, milestoneId))
      .orderBy(asc(deliveries.submittedAt));
  },

  async create(input: CreateDeliveryInput): Promise<DeliveryData> {
    const [result] = await db.insert(deliveries).values({
      milestoneId: input.milestoneId,
      fileUrl: input.fileUrl,
      hasWatermark: input.hasWatermark ?? true,
      submittedAt: new Date(),
    }).returning();
    if (!result) throw new Error('Failed to create delivery');
    return result;
  },
};
