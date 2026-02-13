import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { milestoneRepository, deliveryRepository } from '@/adapters/db/repositories/milestone';
import { createMilestoneUseCases } from '@/core/usecases/milestone';

const milestoneUseCases = createMilestoneUseCases(milestoneRepository, deliveryRepository);

/** GET /api/milestones?projectId=xxx */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const milestones = await milestoneUseCases.listByProject(projectId);
  return NextResponse.json(milestones);
}

/** POST /api/milestones */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    projectId: string; title: string; description: string; amount: number; dueDate: string;
  };

  try {
    const milestone = await milestoneUseCases.createMilestone({
      ...body,
      dueDate: new Date(body.dueDate),
    });
    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 400 });
  }
}

/** PATCH /api/milestones?id=xxx&action=submit|approve|revision|complete */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  const action = request.nextUrl.searchParams.get('action');
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const actionMap: Record<string, () => Promise<unknown>> = {
    submit: () => milestoneUseCases.submitMilestone(id),
    approve: () => milestoneUseCases.approveMilestone(id),
    revision: () => milestoneUseCases.requestRevision(id),
    complete: () => milestoneUseCases.completeMilestone(id),
  };

  const handler = actionMap[action];
  if (!handler) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const result = await handler();
  return NextResponse.json(result);
}
