import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { profileRepository, creatorProfileRepository } from '@/adapters/db/repositories/profile';

/**
 * POST /api/creators - Create or update creator profile
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can create creator profiles' }, { status: 403 });
  }

  const body = await request.json() as {
    intro: string;
    skills: string[];
    tools: string[];
    availability?: 'available' | 'busy' | 'unavailable';
    hourlyRate?: string;
    portfolioUrl?: string;
  };

  // Check if creator profile already exists
  const existing = await creatorProfileRepository.findByProfileId(profile.id);

  if (existing) {
    // Update
    const updated = await creatorProfileRepository.update(existing.id, {
      intro: body.intro,
      skills: body.skills,
      tools: body.tools,
      availability: body.availability,
      hourlyRate: body.hourlyRate,
      portfolioUrl: body.portfolioUrl,
    });
    return NextResponse.json(updated);
  }

  // Create
  const created = await creatorProfileRepository.create({
    profileId: profile.id,
    intro: body.intro,
    skills: body.skills,
    tools: body.tools,
    availability: body.availability,
    hourlyRate: body.hourlyRate,
    portfolioUrl: body.portfolioUrl,
  });

  return NextResponse.json(created, { status: 201 });
}
