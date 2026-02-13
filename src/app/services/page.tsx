export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shared/AppShell';
import { ServiceCard } from '@/components/service/ServiceCard';
import { ServiceFilters } from '@/components/service/ServiceFilters';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { createServiceUseCases } from '@/core/usecases/service';
import type { ServiceSort, ServiceFilters as ServiceFiltersType } from '@/core/ports/service-repository';

const serviceUseCases = createServiceUseCases(serviceRepository);

const SORT_MAP: Record<string, ServiceSort> = {
  popular: { field: 'orderCount', direction: 'desc' },
  newest: { field: 'createdAt', direction: 'desc' },
  rating: { field: 'avgRating', direction: 'desc' },
  price_asc: { field: 'price', direction: 'asc' },
  price_desc: { field: 'price', direction: 'desc' },
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const sortKey = params.sort ?? 'popular';
  const page = parseInt(params.page ?? '1', 10);
  const category = params.category ?? '';
  const sort = SORT_MAP[sortKey] ?? SORT_MAP.popular;

  // Build filters from URL params
  const filters: ServiceFiltersType = {};
  if (params.minPrice) filters.minPrice = parseInt(params.minPrice, 10);
  if (params.maxPrice) filters.maxPrice = parseInt(params.maxPrice, 10);
  if (params.delivery) filters.maxDeliveryDays = parseInt(params.delivery, 10);
  if (params.level) filters.sellerLevel = params.level;
  if (params.rating) filters.minRating = parseFloat(params.rating);

  const { services, total } = await serviceUseCases.listServicesByCategory(
    category,
    filters,
    sort,
    { page, limit: 20 },
  );

  // Build pagination URL preserving all current params
  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (sortKey !== 'popular') p.set('sort', sortKey);
    if (category) p.set('category', category);
    if (params.minPrice) p.set('minPrice', params.minPrice);
    if (params.maxPrice) p.set('maxPrice', params.maxPrice);
    if (params.delivery) p.set('delivery', params.delivery);
    if (params.level) p.set('level', params.level);
    if (params.rating) p.set('rating', params.rating);
    if (targetPage > 1) p.set('page', String(targetPage));
    const qs = p.toString();
    return `/services${qs ? `?${qs}` : ''}`;
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-1">
            <Link href="/" className="hover:text-gray-900">홈</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-900">서비스</span>
          </nav>
          <h1 className="text-2xl font-bold">AI 영상 서비스</h1>
          <p className="text-sm text-muted-foreground mt-1">총 {total}개 서비스</p>
        </div>

        {/* Filters + Sort */}
        <Suspense fallback={null}>
          <ServiceFilters />
        </Suspense>

        {/* Grid */}
        <div className="mt-6">
          {services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🎬</div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">검색 조건에 맞는 서비스가 없습니다</h2>
              <p className="text-sm text-muted-foreground mb-6">필터를 조정하거나 다른 카테고리를 선택해보세요.</p>
              <Link
                href="/services"
                className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-peach-400 to-serenity-400 text-white text-sm font-medium hover:scale-105 transition-transform"
              >
                전체 서비스 보기
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm hover:bg-gray-200 transition-colors"
              >
                ← 이전
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-muted-foreground">
              {page} / {Math.ceil(total / 20)}
            </span>
            {page * 20 < total && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm hover:bg-gray-200 transition-colors"
              >
                다음 →
              </Link>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
