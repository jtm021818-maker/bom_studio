import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { proposalRepository } from '@/adapters/db/repositories/proposal';
import { createProposalUseCases } from '@/core/usecases/proposal';

const proposalUseCases = createProposalUseCases(proposalRepository);

/**
 * GET /api/proposals?projectId=xxx | creatorId=xxx
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  const creatorId = request.nextUrl.searchParams.get('creatorId');

  if (projectId) {
    const proposals = await proposalUseCases.listByProject(projectId);
    return NextResponse.json(proposals);
  }

  if (creatorId) {
    const proposals = await proposalUseCases.listByCreator(creatorId);
    return NextResponse.json(proposals);
  }

  // Default: return proposals for current user's profile
  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const proposals = profile.role === 'creator'
    ? await proposalUseCases.listByCreator(profile.id)
    : await proposalUseCases.listByProject(profile.id);

  return NextResponse.json(proposals);
}

/**
 * POST /api/proposals
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile || profile.role !== 'creator') {
    return NextResponse.json({ error: 'Only creators can submit proposals' }, { status: 403 });
  }

  const body = await request.json() as {
    projectId: string;
    deliveryDays: number;
    milestones: string;
    revisionScope: string;
    price: number;
  };

  try {
    const proposal = await proposalUseCases.createProposal({
      projectId: body.projectId,
      creatorId: profile.id,
      deliveryDays: body.deliveryDays,
      milestones: body.milestones,
      revisionScope: body.revisionScope,
      price: body.price,
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '제안서 등록 실패';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/**
 * PATCH /api/proposals?id=xxx&action=accept|reject
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  const action = request.nextUrl.searchParams.get('action');

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action params required' }, { status: 400 });
  }

  if (action === 'accept') {
    const result = await proposalUseCases.acceptProposal(id);
    return NextResponse.json(result);
  }

  if (action === 'reject') {
    const result = await proposalUseCases.rejectProposal(id);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
