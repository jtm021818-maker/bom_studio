import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { createServiceUseCases } from '@/core/usecases/service';

const serviceUseCases = createServiceUseCases(serviceRepository);

/**
 * GET /api/services/[id] — Get service detail
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const service = await serviceUseCases.getService(id);

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  // Increment view count (fire and forget)
  serviceUseCases.incrementViewCount(id).catch(() => {});

  return NextResponse.json(service);
}

/**
 * PATCH /api/services/[id] — Update service (owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const service = await serviceUseCases.getService(id);
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  if (service.creatorId !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updated = await serviceUseCases.updateService(id, body);

  return NextResponse.json(updated);
}

/**
 * DELETE /api/services/[id] — Soft delete service (owner only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const service = await serviceUseCases.getService(id);
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  if (service.creatorId !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deleted = await serviceUseCases.deleteService(id);
  return NextResponse.json(deleted);
}
