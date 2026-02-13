export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { Button } from '@/components/ui/button';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { createServiceUseCases } from '@/core/usecases/service';
import { SERVICE_CATEGORIES } from '@/core/validators/service';
import { formatKRW } from '@/lib/utils';
import { ServiceDetailClient } from './ServiceDetailClient';

const serviceUseCases = createServiceUseCases(serviceRepository);

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await serviceUseCases.getService(id);

  if (!service || service.status === 'deleted') {
    notFound();
  }

  // Increment view count (fire and forget)
  serviceUseCases.incrementViewCount(id).catch(() => {});

  const categoryInfo = SERVICE_CATEGORIES.find((c) => c.value === service.category);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-gray-900">홈</Link>
          <span className="mx-1">/</span>
          <Link href="/services" className="hover:text-gray-900">서비스</Link>
          {categoryInfo && (
            <>
              <span className="mx-1">/</span>
              <Link href={`/services/${service.category}`} className="hover:text-gray-900">{categoryInfo.label}</Link>
            </>
          )}
          <span className="mx-1">/</span>
          <span className="text-gray-900 line-clamp-1 inline">{service.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-peach-100 to-serenity-100">
              {service.thumbnailUrl ? (
                <img src={service.thumbnailUrl} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl opacity-40">🎬</span>
                </div>
              )}
            </div>

            {/* Gallery thumbs */}
            {service.galleryUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {service.galleryUrls.map((url, i) => (
                  <div key={i} className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={url} alt={`갤러리 ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Title & Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {categoryInfo && <span>{categoryInfo.icon} {categoryInfo.label}</span>}
                {service.reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {service.avgRating.toFixed(1)} ({service.reviewCount}개 리뷰)
                  </span>
                )}
                <span>주문 {service.orderCount}건</span>
              </div>
            </div>

            {/* Tags */}
            {service.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {service.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600">{tag}</span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <h2 className="text-lg font-semibold mb-3">서비스 설명</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{service.description}</p>
            </div>

            {/* FAQ */}
            {service.faq.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">자주 묻는 질문</h2>
                <div className="space-y-3">
                  {service.faq.map((item, i) => (
                    <GlassCard key={i}>
                      <GlassCardContent className="py-4">
                        <p className="font-medium text-sm mb-1">Q. {item.question}</p>
                        <p className="text-sm text-muted-foreground">A. {item.answer}</p>
                      </GlassCardContent>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar (1/3) — hidden on mobile, package tabs shown in sidebar */}
          <div className="space-y-6 hidden lg:block">
            {/* Package Tabs */}
            <ServiceDetailClient packages={service.packages} serviceId={service.id} />

            {/* Creator Info */}
            <GlassCard>
              <GlassCardContent className="py-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-peach-300 to-serenity-300 flex items-center justify-center text-white text-lg font-medium">
                    C
                  </div>
                  <div>
                    <p className="font-medium text-sm">크리에이터</p>
                    <p className="text-xs text-muted-foreground">응답률 95%</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">문의하기</Button>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Mobile: Package section (visible only on mobile/tablet) */}
          <div className="lg:hidden space-y-6">
            <ServiceDetailClient packages={service.packages} serviceId={service.id} />

            {/* Creator Info */}
            <GlassCard>
              <GlassCardContent className="py-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-peach-300 to-serenity-300 flex items-center justify-center text-white text-lg font-medium">
                    C
                  </div>
                  <div>
                    <p className="font-medium text-sm">크리에이터</p>
                    <p className="text-xs text-muted-foreground">응답률 95%</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">문의하기</Button>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>

        {/* Mobile Sticky Bottom Price Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {service.packages.length > 0
                  ? formatKRW(Math.min(...service.packages.map((p) => p.price)))
                  : '가격 미정'}
                <span className="text-xs font-normal text-muted-foreground">~</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {service.packages.length > 0
                  ? `${service.packages[0]!.deliveryDays}일 납기`
                  : ''}
              </p>
            </div>
            <Link href={`/service/${service.id}/checkout?tier=${service.packages[0]?.tier ?? 'basic'}`}>
              <JellyButton gradient="mixed" size="lg" className="px-8 min-h-[44px]">
                구매하기
              </JellyButton>
            </Link>
          </div>
        </div>
        {/* Spacer for mobile sticky bar */}
        <div className="h-20 lg:hidden" />
      </div>
    </AppShell>
  );
}
