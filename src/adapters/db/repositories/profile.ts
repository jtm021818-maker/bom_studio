import { eq } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { profiles, creatorProfiles } from '@/adapters/db/schema/profiles';
import type { ProfileRepository, CreatorProfileRepository } from '@/core/ports/profile-repository';
import type { ProfileData, CreateProfileInput, UpdateProfileInput, CreatorProfileData, CreateCreatorProfileInput } from '@/core/types/profile';

export const profileRepository: ProfileRepository = {
  async findById(id: string): Promise<ProfileData | null> {
    const results = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return results[0] ?? null;
  },

  async findByUserId(userId: string): Promise<ProfileData | null> {
    const results = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return results[0] ?? null;
  },

  async create(input: CreateProfileInput): Promise<ProfileData> {
    const [result] = await db.insert(profiles).values({
      userId: input.userId,
      name: input.name,
      email: input.email,
      role: input.role,
      avatar: input.avatar ?? null,
    }).returning();
    if (!result) throw new Error('Failed to create profile');
    return result;
  },

  async update(id: string, input: UpdateProfileInput): Promise<ProfileData> {
    const [result] = await db.update(profiles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    if (!result) throw new Error('Profile not found');
    return result;
  },
};

export const creatorProfileRepository: CreatorProfileRepository = {
  async findByProfileId(profileId: string): Promise<CreatorProfileData | null> {
    const results = await db.select().from(creatorProfiles).where(eq(creatorProfiles.profileId, profileId)).limit(1);
    const result = results[0];
    if (!result) return null;
    return {
      id: result.id,
      profileId: result.profileId,
      intro: result.intro,
      skills: result.skills,
      tools: result.tools,
      availability: result.availability,
      hourlyRate: result.hourlyRate,
      portfolioUrl: result.portfolioUrl,
    };
  },

  async create(input: CreateCreatorProfileInput): Promise<CreatorProfileData> {
    const [result] = await db.insert(creatorProfiles).values({
      profileId: input.profileId,
      intro: input.intro,
      skills: input.skills,
      tools: input.tools,
      availability: input.availability ?? 'available',
      hourlyRate: input.hourlyRate ?? null,
      portfolioUrl: input.portfolioUrl ?? null,
    }).returning();
    if (!result) throw new Error('Failed to create creator profile');
    return {
      id: result.id,
      profileId: result.profileId,
      intro: result.intro,
      skills: result.skills,
      tools: result.tools,
      availability: result.availability,
      hourlyRate: result.hourlyRate,
      portfolioUrl: result.portfolioUrl,
    };
  },

  async update(id: string, input: Partial<CreateCreatorProfileInput>): Promise<CreatorProfileData> {
    const [result] = await db.update(creatorProfiles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(creatorProfiles.id, id))
      .returning();
    if (!result) throw new Error('Creator profile not found');
    return {
      id: result.id,
      profileId: result.profileId,
      intro: result.intro,
      skills: result.skills,
      tools: result.tools,
      availability: result.availability,
      hourlyRate: result.hourlyRate,
      portfolioUrl: result.portfolioUrl,
    };
  },
};
