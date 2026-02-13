import type { MilestoneData, CreateMilestoneInput, UpdateMilestoneInput, DeliveryData, CreateDeliveryInput } from '@/core/types/milestone';

export interface MilestoneRepository {
  findById(id: string): Promise<MilestoneData | null>;
  findByProjectId(projectId: string): Promise<MilestoneData[]>;
  create(input: CreateMilestoneInput): Promise<MilestoneData>;
  update(id: string, input: UpdateMilestoneInput): Promise<MilestoneData>;
}

export interface DeliveryRepository {
  findByMilestoneId(milestoneId: string): Promise<DeliveryData[]>;
  create(input: CreateDeliveryInput): Promise<DeliveryData>;
}
