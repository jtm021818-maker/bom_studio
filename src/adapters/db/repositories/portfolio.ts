import { eq, asc } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { portfolioItems } from '@/adapters/db/schema/portfolio';
import type { PortfolioRepository } from '@/core/ports/portfolio-repository';
import type { PortfolioItemData, CreatePortfolioItemInput, UpdatePortfolioItemInput } from '@/core/types/portfolio';

export const portfolioRepository: PortfolioRepository = {
  async findByCreatorProfileId(creatorProfileId: string): Promise<PortfolioItemData[]> {
    const results = await db.select().from(portfolioItems)
      .where(eq(portfolioItems.creatorProfileId, creatorProfileId))
      .orderBy(asc(portfolioItems.sortOrder));
    return results;
  },

  async findById(id: string): Promise<PortfolioItemData | null> {
    const results = await db.select().from(portfolioItems)
      .where(eq(portfolioItems.id, id))
      .limit(1);
    return results[0] ?? null;
  },

  async create(input: CreatePortfolioItemInput): Promise<PortfolioItemData> {
    const [result] = await db.insert(portfolioItems).values({
      creatorProfileId: input.creatorProfileId,
      title: input.title,
      description: input.description ?? null,
      fileUrl: input.fileUrl,
      thumbnailUrl: input.thumbnailUrl ?? null,
      mediaType: input.mediaType,
      sortOrder: input.sortOrder ?? 0,
    }).returning();
    if (!result) throw new Error('Failed to create portfolio item');
    return result;
  },

  async update(id: string, input: UpdatePortfolioItemInput): Promise<PortfolioItemData> {
    const [result] = await db.update(portfolioItems)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(portfolioItems.id, id))
      .returning();
    if (!result) throw new Error('Portfolio item not found');
    return result;
  },

  async delete(id: string): Promise<void> {
    // Soft delete
    await db.update(portfolioItems)
      .set({ deletedAt: new Date() })
      .where(eq(portfolioItems.id, id));
  },
};
