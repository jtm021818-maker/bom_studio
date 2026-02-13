import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { reviewRepository, disputeRepository } from '@/adapters/db/repositories/review';
import { createReviewUseCases } from '@/core/usecases/review';

const reviewUseCases = createReviewUseCases(reviewRepository, disputeRepository);

/** GET /api/reviews?projectId=xxx | revieweeId=xxx */
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  const revieweeId = request.nextUrl.searchParams.get('revieweeId');

  if (projectId) {
    return NextResponse.json(await reviewUseCases.getProjectReviews(projectId));
  }
  if (revieweeId) {
    return NextResponse.json(await reviewUseCases.getCreatorReviews(revieweeId));
  }
  return NextResponse.json({ error: 'projectId or revieweeId required' }, { status: 400 });
}

/** POST /api/reviews */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await request.json() as {
    projectId: string; revieweeId: string; rating: number; comment: string;
  };

  try {
    const review = await reviewUseCases.createReview({
      ...body,
      reviewerId: profile.id,
    });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 400 });
  }
}
