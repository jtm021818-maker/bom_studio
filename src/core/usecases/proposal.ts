import type { ProposalRepository } from '@/core/ports/proposal-repository';
import type { ProposalData, CreateProposalInput, UpdateProposalInput } from '@/core/types/proposal';

export function createProposalUseCases(proposalRepo: ProposalRepository) {
  return {
    async getProposal(id: string): Promise<ProposalData | null> {
      return proposalRepo.findById(id);
    },

    async listByProject(projectId: string): Promise<ProposalData[]> {
      return proposalRepo.findByProjectId(projectId);
    },

    async listByCreator(creatorId: string): Promise<ProposalData[]> {
      return proposalRepo.findByCreatorId(creatorId);
    },

    async createProposal(input: CreateProposalInput): Promise<ProposalData> {
      if (input.price < 10000) {
        throw new Error('제안 금액은 ₩10,000 이상이어야 합니다.');
      }
      if (input.deliveryDays < 1) {
        throw new Error('납품 기간은 최소 1일 이상이어야 합니다.');
      }
      return proposalRepo.create(input);
    },

    async acceptProposal(id: string): Promise<ProposalData> {
      return proposalRepo.update(id, { status: 'accepted' });
    },

    async rejectProposal(id: string): Promise<ProposalData> {
      return proposalRepo.update(id, { status: 'rejected' });
    },

    async updateProposal(id: string, input: UpdateProposalInput): Promise<ProposalData> {
      return proposalRepo.update(id, input);
    },
  };
}
