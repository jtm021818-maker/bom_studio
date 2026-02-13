export type Role = 'client' | 'creator' | 'admin';

export interface ProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  bio: string | null;
}

export interface CreateProfileInput {
  userId: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface CreatorProfileData {
  id: string;
  profileId: string;
  intro: string;
  skills: string[];
  tools: string[];
  availability: 'available' | 'busy' | 'unavailable';
  hourlyRate: string | null;
  portfolioUrl: string | null;
}

export interface CreateCreatorProfileInput {
  profileId: string;
  intro: string;
  skills: string[];
  tools: string[];
  availability?: 'available' | 'busy' | 'unavailable';
  hourlyRate?: string;
  portfolioUrl?: string;
}
