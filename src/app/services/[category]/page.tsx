export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shared/AppShell';
import { ServiceCard } from '@/components/service/ServiceCard';
import { ServiceFilters } from '@/components/service/ServiceFilters';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { createServiceUseCases } from '@/core/usecases/service';
import { SERVICE_CATEGORIES } from '@/core/validators/service';
import type { ServiceSort, ServiceFilters as ServiceFiltersType } from '@/core/ports/service-repository';

const serviceUseCases = createServiceUseCases(serviceRepository);

const SORT_MAP: Record<string, ServiceSort> = {
  popular: { field: 'orderCount', direction: 'desc' },
  newest: { field: 'createdAt', direction: 'desc' },
  rating: { field: 'avgRating', direction: 'desc' },
  price_asc: { field: 'price', direction: 'asc' },
  price_desc: { field: 'price', direction: 'desc' },
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { category } = await params;
  const qp = await searchParams;

  const categoryInfo = SERVICE_CATEGORIES.find((c) => c.value === category);
  if (!categoryInfo) {
    notFound();
  }

  const sortKey = qp.sort ?? 'popular';
  const page = parseInt(qp.page ?? '1', 10);
  const sort = SORT_MAP[sortKey] ?? SORT_MAP.popular;

  // Build filters from URL params
  const filters: ServiceFiltersType = {};
  if (qp.minPrice) filters.minPrice = parseInt(qp.minPrice, 10);
  if (qp.maxPrice) filters.maxPrice = parseInt(qp.maxPrice, 10);
  if (qp.delivery) filters.maxDeliveryDays = parseInt(qp.delivery, 10);
  if (qp.level) filters.sellerLevel = qp.level;
  if (qp.rating) filters.minRating = parseFloat(qp.rating);

  // Fetch filtered list + top 4 popular (unfiltered, for highlight on page 1)
  const [filteredResult, topResult] = await Promise.all([
    serviceUseCases.listServicesByCategory(category, filters, sort, { page, limit: 20 }),
    page === 1
      ? serviceUseCases.listServicesByCategory(category, {}, { field: 'orderCount', direction: 'desc' }, { page: 1, limit: 4 })
      : Promise.resolve({ services: [], total: 0 }),
  ]);

  const { services, total } = filteredResult;
  const topServices = topResult.services;
  const hasActiveFilters = Object.keys(filters).length > 0 || sortKey !== 'popular';

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Category Header */}
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-gray-900">홈</Link>
            <span className="mx-1">/</span>
            <Link href="/services" className="hover:text-gray-900">서비스</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-900">{categoryInfo.label}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{categoryInfo.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{categoryInfo.label}</h1>
              <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">총 {total}개 서비스</p>
        </div>

        {/* Top Services Highlight (page 1 only, no active filters) */}
        {page === 1 && !hasActiveFilters && topServices.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4">
              {categoryInfo.icon} 인기 {categoryInfo.label} 서비스
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {topServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            {total > 4 && (
              <div className="border-b border-gray-100 mt-8" />
            )}
          </div>
        )}

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
              <div className="text-5xl mb-4">{categoryInfo.icon}</div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {categoryInfo.label} 카테고리에 등록된 서비스가 없습니다
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                이 카테고리에서 첫 서비스를 등록해보세요!
              </p>
              <Link
                href="/service/new"
                className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-peach-400 to-serenity-400 text-white text-sm font-medium hover:scale-105 transition-transform"
              >
                서비스 등록하기
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/services/${category}?sort=${sortKey}&page=${page - 1}`}
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
                href={`/services/${category}?sort=${sortKey}&page=${page + 1}`}
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

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryInfo = SERVICE_CATEGORIES.find((c) => c.value === category);
  if (!categoryInfo) return { title: '카테고리를 찾을 수 없습니다' };

  return {
    title: `${categoryInfo.label} - AI 영상 서비스 | 봄결 스튜디오`,
    description: categoryInfo.description,
  };
}
