import { NextRequest, NextResponse } from 'next/server';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { createServiceUseCases } from '@/core/usecases/service';

const serviceUseCases = createServiceUseCases(serviceRepository);

/**
 * GET /api/services/featured?limit=8 — Get featured/popular services
 */
export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '8', 10);
  const services = await serviceUseCases.listFeaturedServices(limit);
  return NextResponse.json(services);
}
