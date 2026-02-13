import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { createServiceUseCases } from '@/core/usecases/service';
import { createServicePayloadSchema } from '@/core/validators/service';
import type { ServiceSort } from '@/core/ports/service-repository';

const serviceUseCases = createServiceUseCases(serviceRepository);

/**
 * GET /api/services?category=...&sort=popular|newest|rating|price_asc|price_desc&page=1&limit=20&minRating=4.0&scope=mine
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const scope = sp.get('scope');
  const category = sp.get('category');
  const sortParam = sp.get('sort') ?? 'popular';
  const page = parseInt(sp.get('page') ?? '1', 10);
  const limit = parseInt(sp.get('limit') ?? '20', 10);
  const minRating = sp.get('minRating') ? parseFloat(sp.get('minRating')!) : undefined;
  const minPrice = sp.get('minPrice') ? parseInt(sp.get('minPrice')!, 10) : undefined;
  const maxPrice = sp.get('maxPrice') ? parseInt(sp.get('maxPrice')!, 10) : undefined;
  const maxDeliveryDays = sp.get('maxDeliveryDays') ? parseInt(sp.get('maxDeliveryDays')!, 10) : undefined;

  // scope=mine → return user's services
  if (scope === 'mine') {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const profile = await profileRepository.findByUserId(user.id);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const services = await serviceUseCases.listCreatorServices(profile.id);
    return NextResponse.json(services);
  }

  // Sort mapping
  const sortMap: Record<string, ServiceSort> = {
    popular: { field: 'orderCount', direction: 'desc' },
    newest: { field: 'createdAt', direction: 'desc' },
    rating: { field: 'avgRating', direction: 'desc' },
    price_asc: { field: 'price', direction: 'asc' },
    price_desc: { field: 'price', direction: 'desc' },
  };
  const sort = sortMap[sortParam] ?? sortMap.popular;

  const filters = {
    ...(minRating !== undefined && { minRating }),
    ...(minPrice !== undefined && { minPrice }),
    ...(maxPrice !== undefined && { maxPrice }),
    ...(maxDeliveryDays !== undefined && { maxDeliveryDays }),
  };

  if (category) {
    const result = await serviceUseCases.listServicesByCategory(
      category,
      filters,
      sort,
      { page, limit },
    );
    return NextResponse.json(result);
  }

  // No category → featured/all
  const result = await serviceUseCases.listServicesByCategory(
    '',
    filters,
    sort,
    { page, limit },
  );
  return NextResponse.json(result);
}

/**
 * POST /api/services — Create a new service (creator only)
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
    return NextResponse.json({ error: 'Only creators can create services' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createServicePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const service = await serviceUseCases.createService({
    creatorId: profile.id,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    packages: parsed.data.packages,
    tags: parsed.data.tags,
    faq: parsed.data.faq,
    thumbnailUrl: parsed.data.thumbnailUrl,
    galleryUrls: parsed.data.galleryUrls,
  });

  return NextResponse.json(service, { status: 201 });
}
