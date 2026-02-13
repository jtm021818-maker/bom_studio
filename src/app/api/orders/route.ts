import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { orderRepository } from '@/adapters/db/repositories/order';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { createOrderUseCases } from '@/core/usecases/order';

const orderUseCases = createOrderUseCases(orderRepository, serviceRepository);

const createOrderSchema = z.object({
  serviceId: z.string().uuid(),
  packageTier: z.enum(['basic', 'standard', 'premium']),
  requirements: z.string().default(''),
});

/**
 * GET /api/orders?scope=mine|buyer|creator
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const scope = request.nextUrl.searchParams.get('scope') ?? 'mine';

  if (scope === 'creator' && profile.role === 'creator') {
    const orders = await orderUseCases.listCreatorOrders(profile.id);
    return NextResponse.json(orders);
  }

  // Default: buyer orders
  const orders = await orderUseCases.listBuyerOrders(profile.id);
  return NextResponse.json(orders);
}

/**
 * POST /api/orders — Create a new order
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

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await orderUseCases.createOrder({
      serviceId: parsed.data.serviceId,
      buyerId: profile.id,
      packageTier: parsed.data.packageTier,
      requirements: parsed.data.requirements,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
