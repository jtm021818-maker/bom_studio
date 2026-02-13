import type { PortfolioItemData, CreatePortfolioItemInput, UpdatePortfolioItemInput } from '@/core/types/portfolio';

export interface PortfolioRepository {
  findByCreatorProfileId(creatorProfileId: string): Promise<PortfolioItemData[]>;
  findById(id: string): Promise<PortfolioItemData | null>;
  create(input: CreatePortfolioItemInput): Promise<PortfolioItemData>;
  update(id: string, input: UpdatePortfolioItemInput): Promise<PortfolioItemData>;
  delete(id: string): Promise<void>;
}
