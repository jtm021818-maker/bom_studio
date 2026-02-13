import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { milestoneRepository, deliveryRepository } from '@/adapters/db/repositories/milestone';
import { createMilestoneUseCases } from '@/core/usecases/milestone';

const milestoneUseCases = createMilestoneUseCases(milestoneRepository, deliveryRepository);

/** GET /api/deliveries?milestoneId=xxx */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const milestoneId = request.nextUrl.searchParams.get('milestoneId');
  if (!milestoneId) return NextResponse.json({ error: 'milestoneId required' }, { status: 400 });

  const deliveries = await milestoneUseCases.getDeliveries(milestoneId);
  return NextResponse.json(deliveries);
}

/** POST /api/deliveries */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    milestoneId: string;
    fileUrl: string;
    hasWatermark?: boolean;
  };

  const delivery = await milestoneUseCases.submitDelivery({
    milestoneId: body.milestoneId,
    fileUrl: body.fileUrl,
    hasWatermark: body.hasWatermark,
  });

  return NextResponse.json(delivery, { status: 201 });
}
