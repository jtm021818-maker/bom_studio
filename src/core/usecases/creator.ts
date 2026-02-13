import type { CreatorProfileRepository } from '@/core/ports/profile-repository';
import type { PortfolioRepository } from '@/core/ports/portfolio-repository';
import type { CreatorProfileData, CreateCreatorProfileInput } from '@/core/types/profile';
import type { PortfolioItemData, CreatePortfolioItemInput, UpdatePortfolioItemInput } from '@/core/types/portfolio';

export function createCreatorUseCases(
  creatorRepo: CreatorProfileRepository,
  portfolioRepo: PortfolioRepository
) {
  return {
    // ─── Creator Profile ───
    async getCreatorProfile(profileId: string): Promise<CreatorProfileData | null> {
      return creatorRepo.findByProfileId(profileId);
    },

    async createCreatorProfile(input: CreateCreatorProfileInput): Promise<CreatorProfileData> {
      return creatorRepo.create(input);
    },

    async updateCreatorProfile(id: string, input: Partial<CreateCreatorProfileInput>): Promise<CreatorProfileData> {
      return creatorRepo.update(id, input);
    },

    // ─── Portfolio ───
    async getPortfolio(creatorProfileId: string): Promise<PortfolioItemData[]> {
      return portfolioRepo.findByCreatorProfileId(creatorProfileId);
    },

    async addPortfolioItem(input: CreatePortfolioItemInput): Promise<PortfolioItemData> {
      return portfolioRepo.create(input);
    },

    async updatePortfolioItem(id: string, input: UpdatePortfolioItemInput): Promise<PortfolioItemData> {
      return portfolioRepo.update(id, input);
    },

    async removePortfolioItem(id: string): Promise<void> {
      return portfolioRepo.delete(id);
    },

    // ─── Combined View ───
    async getCreatorWithPortfolio(profileId: string): Promise<{
      creator: CreatorProfileData;
      portfolio: PortfolioItemData[];
    } | null> {
      const creator = await creatorRepo.findByProfileId(profileId);
      if (!creator) return null;

      const portfolio = await portfolioRepo.findByCreatorProfileId(creator.id);
      return { creator, portfolio };
    },
  };
}
