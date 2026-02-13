import type { ProfileData, CreateProfileInput, UpdateProfileInput, CreatorProfileData, CreateCreatorProfileInput } from '@/core/types/profile';

export interface ProfileRepository {
  findById(id: string): Promise<ProfileData | null>;
  findByUserId(userId: string): Promise<ProfileData | null>;
  create(input: CreateProfileInput): Promise<ProfileData>;
  update(id: string, input: UpdateProfileInput): Promise<ProfileData>;
}

export interface CreatorProfileRepository {
  findByProfileId(profileId: string): Promise<CreatorProfileData | null>;
  create(input: CreateCreatorProfileInput): Promise<CreatorProfileData>;
  update(id: string, input: Partial<CreateCreatorProfileInput>): Promise<CreatorProfileData>;
}
