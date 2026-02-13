import { describe, it, expect, vi } from 'vitest';
import { createProfileUseCases } from '@/core/usecases/profile';
import type { ProfileRepository, CreatorProfileRepository } from '@/core/ports/profile-repository';
import type { ProfileData, CreatorProfileData } from '@/core/types/profile';

const mockProfile: ProfileData = {
  id: 'profile-1',
  userId: 'user-1',
  name: 'Test User',
  email: 'test@test.com',
  role: 'client',
  avatar: null,
  bio: null,
};

const mockCreatorProfile: CreatorProfileData = {
  id: 'cp-1',
  profileId: 'profile-1',
  intro: 'I make videos',
  skills: ['editing', 'motion'],
  tools: ['Premiere', 'After Effects'],
  availability: 'available',
  hourlyRate: '50000',
  portfolioUrl: 'https://portfolio.com',
};

function createMockProfileRepo(): ProfileRepository {
  return {
    findById: vi.fn().mockResolvedValue(mockProfile),
    findByUserId: vi.fn().mockResolvedValue(mockProfile),
    create: vi.fn().mockResolvedValue(mockProfile),
    update: vi.fn().mockResolvedValue({ ...mockProfile, bio: 'Updated bio' }),
  };
}

function createMockCreatorProfileRepo(): CreatorProfileRepository {
  return {
    findByProfileId: vi.fn().mockResolvedValue(mockCreatorProfile),
    create: vi.fn().mockResolvedValue(mockCreatorProfile),
    update: vi.fn().mockResolvedValue({ ...mockCreatorProfile, intro: 'Updated intro' }),
  };
}

describe('Profile Use Cases', () => {
  it('getProfile returns profile by userId', async () => {
    const profileRepo = createMockProfileRepo();
    const creatorRepo = createMockCreatorProfileRepo();
    const useCases = createProfileUseCases(profileRepo, creatorRepo);

    const result = await useCases.getProfile('user-1');
    expect(result).toEqual(mockProfile);
    expect(profileRepo.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('createProfile creates a new profile', async () => {
    const profileRepo = createMockProfileRepo();
    const creatorRepo = createMockCreatorProfileRepo();
    const useCases = createProfileUseCases(profileRepo, creatorRepo);

    const result = await useCases.createProfile({
      userId: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'client',
    });

    expect(result).toEqual(mockProfile);
    expect(profileRepo.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'client',
    });
  });

  it('updateProfile updates bio', async () => {
    const profileRepo = createMockProfileRepo();
    const creatorRepo = createMockCreatorProfileRepo();
    const useCases = createProfileUseCases(profileRepo, creatorRepo);

    const result = await useCases.updateProfile('profile-1', { bio: 'Updated bio' });
    expect(result.bio).toBe('Updated bio');
  });

  it('getCreatorProfile returns creator profile', async () => {
    const profileRepo = createMockProfileRepo();
    const creatorRepo = createMockCreatorProfileRepo();
    const useCases = createProfileUseCases(profileRepo, creatorRepo);

    const result = await useCases.getCreatorProfile('profile-1');
    expect(result).toEqual(mockCreatorProfile);
    expect(creatorRepo.findByProfileId).toHaveBeenCalledWith('profile-1');
  });

  it('createCreatorProfile creates creator profile', async () => {
    const profileRepo = createMockProfileRepo();
    const creatorRepo = createMockCreatorProfileRepo();
    const useCases = createProfileUseCases(profileRepo, creatorRepo);

    const input = {
      profileId: 'profile-1',
      intro: 'I make videos',
      skills: ['editing'],
      tools: ['Premiere'],
    };

    const result = await useCases.createCreatorProfile(input);
    expect(result).toEqual(mockCreatorProfile);
    expect(creatorRepo.create).toHaveBeenCalledWith(input);
  });
});
