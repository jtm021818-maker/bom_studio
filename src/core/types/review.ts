export interface ReviewData {
  id: string;
  projectId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CreateReviewInput {
  projectId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
}

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface DisputeData {
  id: string;
  projectId: string;
  raisedBy: string;
  reason: string;
  evidence: string[] | null;
  status: DisputeStatus;
  createdAt: Date;
}

export interface CreateDisputeInput {
  projectId: string;
  raisedBy: string;
  reason: string;
  evidence?: string[];
}
