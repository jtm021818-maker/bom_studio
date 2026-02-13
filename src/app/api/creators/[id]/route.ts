import { NextRequest, NextResponse } from 'next/server';
import { creatorProfileRepository } from '@/adapters/db/repositories/profile';
import { portfolioRepository } from '@/adapters/db/repositories/portfolio';
import { createCreatorUseCases } from '@/core/usecases/creator';

const creatorUseCases = createCreatorUseCases(creatorProfileRepository, portfolioRepository);

/**
 * GET /api/creators/[id] - Get creator profile with portfolio
 * id = profile ID (not creator_profile ID)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await creatorUseCases.getCreatorWithPortfolio(id);
  if (!result) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}
