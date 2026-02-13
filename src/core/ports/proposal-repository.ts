import type { ProposalData, CreateProposalInput, UpdateProposalInput } from '@/core/types/proposal';

export interface ProposalRepository {
  findById(id: string): Promise<ProposalData | null>;
  findByProjectId(projectId: string): Promise<ProposalData[]>;
  findByCreatorId(creatorId: string): Promise<ProposalData[]>;
  create(input: CreateProposalInput): Promise<ProposalData>;
  update(id: string, input: UpdateProposalInput): Promise<ProposalData>;
}
