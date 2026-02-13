export type ServiceStatus = 'draft' | 'active' | 'paused' | 'deleted';
export type PackageTier = 'basic' | 'standard' | 'premium';

export interface ServicePackage {
  tier: PackageTier;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  videoLength: string;
  features: string[];
}

export interface ServiceData {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  status: ServiceStatus;
  packages: ServicePackage[];
  thumbnailUrl: string;
  galleryUrls: string[];
  tags: string[];
  faq: { question: string; answer: string }[];
  viewCount: number;
  orderCount: number;
  avgRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInput {
  creatorId: string;
  title: string;
  description: string;
  category: string;
  packages: ServicePackage[];
  thumbnailUrl?: string;
  galleryUrls?: string[];
  tags?: string[];
  faq?: { question: string; answer: string }[];
}

export interface UpdateServiceInput {
  title?: string;
  description?: string;
  category?: string;
  status?: ServiceStatus;
  packages?: ServicePackage[];
  thumbnailUrl?: string;
  galleryUrls?: string[];
  tags?: string[];
  faq?: { question: string; answer: string }[];
}
