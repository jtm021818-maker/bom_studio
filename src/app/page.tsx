export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { AppShell } from '@/components/shared/AppShell';
import { ServiceCard } from '@/components/service/ServiceCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { SERVICE_CATEGORIES } from '@/core/validators/service';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { createServiceUseCases } from '@/core/usecases/service';

const serviceUseCases = createServiceUseCases(serviceRepository);

export default async function HomePage() {
  const [popularResult, newestResult, shortFormResult, adResult] = await Promise.all([
    serviceUseCases.listServicesByCategory('', {}, { field: 'orderCount', direction: 'desc' }, { page: 1, limit: 8 }),
    serviceUseCases.listServicesByCategory('', {}, { field: 'createdAt', direction: 'desc' }, { page: 1, limit: 8 }),
    serviceUseCases.listServicesByCategory('short_form', {}, { field: 'orderCount', direction: 'desc' }, { page: 1, limit: 4 }),
    serviceUseCases.listServicesByCategory('ad_commercial', {}, { field: 'orderCount', direction: 'desc' }, { page: 1, limit: 4 }),
  ]);

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-peach-50 via-white to-serenity-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              AI 영상 제작,{' '}
              <span className="bg-gradient-to-r from-peach-500 to-serenity-500 bg-clip-text text-transparent">
                딱 맞는 전문가
              </span>
              를 찾아보세요
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              숏폼, 광고, 뮤직비디오, 모션그래픽... AI 영상 전문 크리에이터를 만나보세요
            </p>

            {/* Search Bar */}
            <form action="/services" method="GET" className="mt-8">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  name="q"
                  placeholder="어떤 AI 영상이 필요하세요?"
                  className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white border border-gray-200 shadow-lg text-base focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-peach-400 to-serenity-400 text-white text-sm font-medium hover:scale-105 transition-transform"
                >
                  검색
                </button>
              </div>
            </form>

            {/* Popular Keywords */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">인기:</span>
              {['숏폼', '광고영상', '뮤직비디오', '모션그래픽', '제품소개'].map((keyword) => (
                <Link
                  key={keyword}
                  href={`/services?q=${encodeURIComponent(keyword)}`}
                  className="px-3 py-1 rounded-full bg-white/80 border border-gray-100 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {/* Decorative gradient blob */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-serenity-100/50 to-transparent pointer-events-none hidden lg:block" />
      </section>

      {/* Category Icon Bar */}
      <section className="border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {SERVICE_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/services/${cat.value}`}
                className="flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-xl hover:bg-gray-50 hover:shadow-sm hover:scale-105 transition-all group"
              >
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 py-12">
        {/* Popular Services */}
        {popularResult.services.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">인기 AI 영상 서비스</h2>
              <Link href="/services?sort=popular" className="text-sm text-peach-500 hover:text-peach-600 font-medium">
                전체보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {popularResult.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}

        {/* Category Recommendations */}
        {shortFormResult.services.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">📱 숏폼</h2>
              <Link href="/services/short_form" className="text-sm text-peach-500 hover:text-peach-600 font-medium">
                더보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {shortFormResult.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}

        {adResult.services.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">📺 광고/커머셜</h2>
              <Link href="/services/ad_commercial" className="text-sm text-peach-500 hover:text-peach-600 font-medium">
                더보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {adResult.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}

        {/* New Services */}
        {newestResult.services.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">새로 등록된 서비스</h2>
              <Link href="/services?sort=newest" className="text-sm text-peach-500 hover:text-peach-600 font-medium">
                전체보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newestResult.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}

        {/* Project Request CTA */}
        <section className="rounded-2xl bg-gradient-to-br from-peach-50 to-serenity-50 p-8 sm:p-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            직접 프로젝트를 등록하고 전문가를 찾아보세요
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-lg mx-auto">
            원하는 조건을 직접 설정하고, AI가 매칭해주는 크리에이터에게 제안을 받아보세요
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/project/new">
              <JellyButton gradient="mixed" size="lg" className="px-8 min-h-[44px]">
                프로젝트 의뢰하기
              </JellyButton>
            </Link>
            <Link href="/explore/creators" className="text-sm text-muted-foreground hover:text-gray-900 transition-colors">
              크리에이터 탐색하기 →
            </Link>
          </div>
        </section>
      </div>

      {/* Trust Signal Bar */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
            <span className="font-medium">총 거래 <span className="text-gray-900">1,200건+</span></span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="font-medium">등록 크리에이터 <span className="text-gray-900">350명+</span></span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="font-medium">평균 평점 <span className="text-gray-900">4.8</span></span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
