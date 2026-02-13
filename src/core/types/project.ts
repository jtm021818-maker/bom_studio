export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled';
export type Channel = 'youtube_short' | 'youtube_long' | 'instagram_reel' | 'tiktok' | 'other';

export interface ProjectData {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budgetMin: number;
  budgetMax: number;
  deadline: Date;
  category: string;
  createdAt: Date;
}

export interface CreateProjectInput {
  clientId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: Date;
  category: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: Date;
  category?: string;
}

export interface VideoBriefData {
  id: string;
  projectId: string;
  channel: Channel;
  duration: string;
  resolution: string;
  aspectRatio: string;
  fps: string;
  style: string;
  prohibitedElements: string[] | null;
  referenceUrls: string[] | null;
}

export interface CreateVideoBriefInput {
  projectId: string;
  channel: Channel;
  duration: string;
  resolution: string;
  aspectRatio: string;
  fps: string;
  style: string;
  prohibitedElements?: string[];
  referenceUrls?: string[];
}
