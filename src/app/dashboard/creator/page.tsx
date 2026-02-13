export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { Badge } from '@/components/ui/badge';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { serviceRepository } from '@/adapters/db/repositories/service';
import { orderRepository } from '@/adapters/db/repositories/order';
import { formatKRW } from '@/lib/utils';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: '활성', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused: { label: '일시중지', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  draft: { label: '임시저장', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export default async function CreatorDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) redirect('/auth');

  const [services, orders] = await Promise.all([
    serviceRepository.findByCreatorId(profile.id),
    orderRepository.findByCreatorId(profile.id),
  ]);

  const activeServices = services.filter((s) => s.status === 'active');
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'reviewed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.sellerReceives, 0);
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = completedOrders
    .filter((o) => o.createdAt >= thisMonth)
    .reduce((sum, o) => sum + o.sellerReceives, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">크리에이터 대시보드</h1>
        <Link href="/service/new">
          <JellyButton gradient="mixed" size="sm">서비스 등록</JellyButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{services.length}</p>
            <p className="text-xs text-muted-foreground">총 서비스</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{activeServices.length}</p>
            <p className="text-xs text-muted-foreground">활성 서비스</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">총 주문</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-peach-600">{formatKRW(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">총 수익</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Revenue Summary */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg">수익 요약</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">총 수익 (수수료 차감 후)</p>
              <p className="text-xl font-bold">{formatKRW(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">이번 달 수익</p>
              <p className="text-xl font-bold text-emerald-600">{formatKRW(monthlyRevenue)}</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* My Services */}
      <div id="services">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">내 서비스</h2>
          <Link href="/service/new" className="text-sm text-peach-500 hover:text-peach-600">
            + 서비스 등록
          </Link>
        </div>

        {services.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">아직 등록한 서비스가 없습니다.</p>
              <Link href="/service/new">
                <JellyButton>첫 서비스 등록하기</JellyButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const statusStyle = STATUS_STYLES[service.status] ?? STATUS_STYLES.draft;
              const startingPrice = service.packages.length > 0
                ? Math.min(...service.packages.map((p) => p.price))
                : 0;

              return (
                <Link key={service.id} href={`/service/${service.id}`}>
                  <GlassCard className="hover:shadow-lg hover:scale-[1.005] transition-all">
                    <GlassCardContent className="flex items-center gap-4 py-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-11 rounded-lg overflow-hidden bg-gradient-to-br from-peach-100 to-serenity-100 flex-shrink-0">
                        {service.thumbnailUrl ? (
                          <img src={service.thumbnailUrl} alt={service.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg opacity-40">🎬</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{service.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] ${statusStyle!.className}`}>
                            {statusStyle!.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">주문 {service.orderCount}건</span>
                        </div>
                      </div>

                      {/* Price */}
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                        {formatKRW(startingPrice)}~
                      </p>
                    </GlassCardContent>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">최근 주문</h2>
          <div className="space-y-2">
            {orders.slice(0, 10).map((order) => (
              <GlassCard key={order.id}>
                <GlassCardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">{order.packageTier}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {order.createdAt.toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatKRW(order.sellerReceives)}</span>
                    <Badge variant="outline" className="text-[10px]">{order.status}</Badge>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <GlassCardHeader><GlassCardTitle className="text-base">프로젝트 탐색</GlassCardTitle></GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm text-muted-foreground mb-3">모집 중인 프로젝트를 찾아 제안서를 보내보세요.</p>
            <Link href="/explore/projects"><JellyButton size="sm" gradient="mixed">탐색하기</JellyButton></Link>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader><GlassCardTitle className="text-base">내 포트폴리오</GlassCardTitle></GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm text-muted-foreground mb-3">포트폴리오를 관리하고 의뢰인에게 어필하세요.</p>
            <Link href={`/creator/${profile.id}`}><JellyButton size="sm" gradient="serenity">보기</JellyButton></Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
