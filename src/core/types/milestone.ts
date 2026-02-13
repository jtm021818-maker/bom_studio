export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'revision_requested' | 'completed';

export interface MilestoneData {
  id: string;
  projectId: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: MilestoneStatus;
  createdAt: Date;
}

export interface CreateMilestoneInput {
  projectId: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  amount?: number;
  dueDate?: Date;
  status?: MilestoneStatus;
}

export interface DeliveryData {
  id: string;
  milestoneId: string;
  fileUrl: string;
  hasWatermark: boolean;
  submittedAt: Date;
  createdAt: Date;
}

export interface CreateDeliveryInput {
  milestoneId: string;
  fileUrl: string;
  hasWatermark?: boolean;
}
