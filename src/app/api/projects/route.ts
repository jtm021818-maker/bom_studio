import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { projectRepository, videoBriefRepository } from '@/adapters/db/repositories/project';
import { profileRepository } from '@/adapters/db/repositories/profile';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scope = searchParams.get('scope'); // 'mine' | 'open'
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  if (scope === 'open') {
    const projects = await projectRepository.findOpen(limit);
    return NextResponse.json(projects);
  }

  // Default: return user's projects
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const projects = await projectRepository.findByClientId(profile.id);
  return NextResponse.json(projects);
}

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

  const body = await request.json() as {
    title: string;
    description: string;
    budgetMin: number;
    budgetMax: number;
    deadline: string;
    category: string;
    videoBrief?: {
      channel: string;
      duration: string;
      resolution: string;
      aspectRatio: string;
      fps: string;
      style: string;
      prohibitedElements?: string[];
      referenceUrls?: string[];
    };
  };

  const project = await projectRepository.create({
    clientId: profile.id,
    title: body.title,
    description: body.description,
    budgetMin: body.budgetMin,
    budgetMax: body.budgetMax,
    deadline: new Date(body.deadline),
    category: body.category,
  });

  // Create video brief if provided
  if (body.videoBrief) {
    await videoBriefRepository.create({
      projectId: project.id,
      channel: body.videoBrief.channel as 'youtube_short' | 'youtube_long' | 'instagram_reel' | 'tiktok' | 'other',
      duration: body.videoBrief.duration,
      resolution: body.videoBrief.resolution,
      aspectRatio: body.videoBrief.aspectRatio,
      fps: body.videoBrief.fps,
      style: body.videoBrief.style,
      prohibitedElements: body.videoBrief.prohibitedElements,
      referenceUrls: body.videoBrief.referenceUrls,
    });
  }

  return NextResponse.json(project, { status: 201 });
}
