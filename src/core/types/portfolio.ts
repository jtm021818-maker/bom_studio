/**
 * Portfolio item types for creator portfolios.
 * Files stored in Supabase Storage private bucket, accessed via signed URLs.
 */

export interface PortfolioItemData {
  id: string;
  creatorProfileId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  mediaType: 'video' | 'image';
  sortOrder: number;
  createdAt: Date;
}

export interface CreatePortfolioItemInput {
  creatorProfileId: string;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  mediaType: 'video' | 'image';
  sortOrder?: number;
}

export interface UpdatePortfolioItemInput {
  title?: string;
  description?: string;
  sortOrder?: number;
}
