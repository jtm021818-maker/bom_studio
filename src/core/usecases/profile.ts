import type { ProfileRepository, CreatorProfileRepository } from '@/core/ports/profile-repository';
import type { ProfileData, CreateProfileInput, UpdateProfileInput, CreatorProfileData, CreateCreatorProfileInput } from '@/core/types/profile';

export function createProfileUseCases(
  profileRepo: ProfileRepository,
  creatorProfileRepo: CreatorProfileRepository
) {
  return {
    async getProfile(userId: string): Promise<ProfileData | null> {
      return profileRepo.findByUserId(userId);
    },

    async getProfileById(id: string): Promise<ProfileData | null> {
      return profileRepo.findById(id);
    },

    async createProfile(input: CreateProfileInput): Promise<ProfileData> {
      return profileRepo.create(input);
    },

    async updateProfile(id: string, input: UpdateProfileInput): Promise<ProfileData> {
      return profileRepo.update(id, input);
    },

    async getCreatorProfile(profileId: string): Promise<CreatorProfileData | null> {
      return creatorProfileRepo.findByProfileId(profileId);
    },

    async createCreatorProfile(input: CreateCreatorProfileInput): Promise<CreatorProfileData> {
      return creatorProfileRepo.create(input);
    },

    async updateCreatorProfile(id: string, input: Partial<CreateCreatorProfileInput>): Promise<CreatorProfileData> {
      return creatorProfileRepo.update(id, input);
    },
  };
}
