import type { MilestoneRepository, DeliveryRepository } from '@/core/ports/milestone-repository';
import type { MilestoneData, CreateMilestoneInput, UpdateMilestoneInput, DeliveryData, CreateDeliveryInput } from '@/core/types/milestone';

export function createMilestoneUseCases(
  milestoneRepo: MilestoneRepository,
  deliveryRepo: DeliveryRepository
) {
  return {
    // ─── Milestones ───
    async getMilestone(id: string): Promise<MilestoneData | null> {
      return milestoneRepo.findById(id);
    },

    async listByProject(projectId: string): Promise<MilestoneData[]> {
      return milestoneRepo.findByProjectId(projectId);
    },

    async createMilestone(input: CreateMilestoneInput): Promise<MilestoneData> {
      if (input.amount < 0) throw new Error('금액은 0 이상이어야 합니다.');
      return milestoneRepo.create(input);
    },

    async updateMilestone(id: string, input: UpdateMilestoneInput): Promise<MilestoneData> {
      return milestoneRepo.update(id, input);
    },

    /** Creator submits deliverable → milestone status = 'submitted' */
    async submitMilestone(id: string): Promise<MilestoneData> {
      return milestoneRepo.update(id, { status: 'submitted' });
    },

    /** Client approves → milestone status = 'approved' */
    async approveMilestone(id: string): Promise<MilestoneData> {
      return milestoneRepo.update(id, { status: 'approved' });
    },

    /** Client requests revision → milestone status = 'revision_requested' */
    async requestRevision(id: string): Promise<MilestoneData> {
      return milestoneRepo.update(id, { status: 'revision_requested' });
    },

    /** Mark milestone as completed (after payment release) */
    async completeMilestone(id: string): Promise<MilestoneData> {
      return milestoneRepo.update(id, { status: 'completed' });
    },

    // ─── Deliveries ───
    async getDeliveries(milestoneId: string): Promise<DeliveryData[]> {
      return deliveryRepo.findByMilestoneId(milestoneId);
    },

    async submitDelivery(input: CreateDeliveryInput): Promise<DeliveryData> {
      const delivery = await deliveryRepo.create(input);
      // Auto-update milestone status to 'submitted'
      await milestoneRepo.update(input.milestoneId, { status: 'submitted' });
      return delivery;
    },
  };
}
