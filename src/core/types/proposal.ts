export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface ProposalData {
  id: string;
  projectId: string;
  creatorId: string;
  deliveryDays: number;
  milestones: string;
  revisionScope: string;
  price: number;
  status: ProposalStatus;
  createdAt: Date;
}

export interface CreateProposalInput {
  projectId: string;
  creatorId: string;
  deliveryDays: number;
  milestones: string;
  revisionScope: string;
  price: number;
}

export interface UpdateProposalInput {
  status?: ProposalStatus;
  deliveryDays?: number;
  milestones?: string;
  revisionScope?: string;
  price?: number;
}
