import type { ServiceRepository, ServiceFilters, ServiceSort } from '@/core/ports/service-repository';
import type { ServiceData, CreateServiceInput, UpdateServiceInput } from '@/core/types/service';

export function createServiceUseCases(serviceRepo: ServiceRepository) {
  return {
    async getService(id: string): Promise<ServiceData | null> {
      return serviceRepo.findById(id);
    },

    async listCreatorServices(creatorId: string): Promise<ServiceData[]> {
      return serviceRepo.findByCreatorId(creatorId);
    },

    async listServicesByCategory(
      category: string,
      filters?: ServiceFilters,
      sort?: ServiceSort,
      pagination?: { page: number; limit: number },
    ): Promise<{ services: ServiceData[]; total: number }> {
      return serviceRepo.findByCategory(category, filters, sort, pagination);
    },

    async listFeaturedServices(limit?: number): Promise<ServiceData[]> {
      return serviceRepo.findFeatured(limit);
    },

    async createService(input: CreateServiceInput): Promise<ServiceData> {
      return serviceRepo.create(input);
    },

    async updateService(id: string, input: UpdateServiceInput): Promise<ServiceData> {
      return serviceRepo.update(id, input);
    },

    async pauseService(id: string): Promise<ServiceData> {
      return serviceRepo.update(id, { status: 'paused' });
    },

    async activateService(id: string): Promise<ServiceData> {
      return serviceRepo.update(id, { status: 'active' });
    },

    async deleteService(id: string): Promise<ServiceData> {
      return serviceRepo.update(id, { status: 'deleted' });
    },

    async incrementViewCount(id: string): Promise<void> {
      return serviceRepo.updateStats(id, 'viewCount', 1);
    },

    async incrementOrderCount(id: string): Promise<void> {
      return serviceRepo.updateStats(id, 'orderCount', 1);
    },
  };
}
