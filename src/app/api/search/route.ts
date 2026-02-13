import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddingProvider } from '@/adapters/ai/embedding';
import { createSearchUseCases } from '@/core/usecases/search';

/**
 * GET /api/search?type=creators|projects&q=...&skills=...&availability=...&category=...
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const type = sp.get('type') ?? 'creators';
  const query = sp.get('q') ?? undefined;
  const limit = parseInt(sp.get('limit') ?? '20', 10);
  const offset = parseInt(sp.get('offset') ?? '0', 10);

  const embeddingProvider = getEmbeddingProvider();
  const searchUseCases = createSearchUseCases(embeddingProvider);

  if (type === 'creators') {
    const skills = sp.get('skills')?.split(',').filter(Boolean) ?? undefined;
    const availability = sp.get('availability') as 'available' | 'busy' | 'unavailable' | undefined;

    const results = await searchUseCases.searchCreators({
      query,
      skills,
      availability: availability ?? undefined,
      limit,
      offset,
    });

    return NextResponse.json({ results, total: results.length });
  }

  if (type === 'projects') {
    const category = sp.get('category') ?? undefined;
    const budgetMin = sp.get('budgetMin') ? parseInt(sp.get('budgetMin') ?? '', 10) : undefined;
    const budgetMax = sp.get('budgetMax') ? parseInt(sp.get('budgetMax') ?? '', 10) : undefined;

    const results = await searchUseCases.searchProjects({
      query,
      category,
      budgetMin,
      budgetMax,
      limit,
      offset,
    });

    return NextResponse.json({ results, total: results.length });
  }

  return NextResponse.json({ error: 'Invalid type. Use "creators" or "projects"' }, { status: 400 });
}
