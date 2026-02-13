import type { ServiceData, CreateServiceInput, UpdateServiceInput } from '@/core/types/service';

export interface ServiceFilters {
  minPrice?: number;
  maxPrice?: number;
  maxDeliveryDays?: number;
  minRating?: number;
  sellerLevel?: string;
  status?: string;
}

export interface ServiceSort {
  field: 'createdAt' | 'orderCount' | 'avgRating' | 'price';
  direction: 'asc' | 'desc';
}

export interface ServiceRepository {
  create(input: CreateServiceInput): Promise<ServiceData>;
  findById(id: string): Promise<ServiceData | null>;
  findByCreatorId(creatorId: string): Promise<ServiceData[]>;
  findByCategory(
    category: string,
    filters?: ServiceFilters,
    sort?: ServiceSort,
    pagination?: { page: number; limit: number },
  ): Promise<{ services: ServiceData[]; total: number }>;
  findFeatured(limit?: number): Promise<ServiceData[]>;
  update(id: string, input: UpdateServiceInput): Promise<ServiceData>;
  updateStats(id: string, field: 'viewCount' | 'orderCount', increment: number): Promise<void>;
}
