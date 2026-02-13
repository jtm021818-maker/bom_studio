import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { reviewRepository, disputeRepository } from '@/adapters/db/repositories/review';
import { createReviewUseCases } from '@/core/usecases/review';

const reviewUseCases = createReviewUseCases(reviewRepository, disputeRepository);

/** GET /api/disputes?projectId=xxx */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  return NextResponse.json(await reviewUseCases.getProjectDisputes(projectId));
}

/** POST /api/disputes */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await request.json() as {
    projectId: string; reason: string; evidence?: string[];
  };

  try {
    const dispute = await reviewUseCases.createDispute({
      ...body,
      raisedBy: profile.id,
    });
    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 400 });
  }
}

/** PATCH /api/disputes?id=xxx&action=investigate|resolve|close */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin check would be added here with ADMIN_EMAILS env
  const id = request.nextUrl.searchParams.get('id');
  const action = request.nextUrl.searchParams.get('action');
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const actionMap: Record<string, () => Promise<unknown>> = {
    investigate: () => reviewUseCases.investigateDispute(id),
    resolve: () => reviewUseCases.resolveDispute(id),
    close: () => reviewUseCases.closeDispute(id),
  };

  const handler = actionMap[action];
  if (!handler) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  return NextResponse.json(await handler());
}
