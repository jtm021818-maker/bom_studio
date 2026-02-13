export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyRange } from '@/components/shared/MoneyDisplay';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { projectRepository } from '@/adapters/db/repositories/project';
import { orderRepository } from '@/adapters/db/repositories/order';
import { formatKRW } from '@/lib/utils';
import type { ProjectStatus } from '@/core/types/project';

const ORDER_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: '결제 대기', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: '결제 완료', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  project_created: { label: '프로젝트 생성', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: '진행 중', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: '완료', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reviewed: { label: '리뷰 완료', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: '취소', className: 'bg-red-50 text-red-600 border-red-200' },
  refunded: { label: '환불', className: 'bg-red-50 text-red-600 border-red-200' },
};

export default async function ClientDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) redirect('/auth');

  const [projects, orders] = await Promise.all([
    projectRepository.findByClientId(profile.id),
    orderRepository.findByBuyerId(profile.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">의뢰인 대시보드</h1>
        <div className="flex gap-2">
          <Link href="/services">
            <JellyButton gradient="serenity" size="sm">서비스 찾기</JellyButton>
          </Link>
          <Link href="/project/new">
            <JellyButton gradient="mixed" size="sm">프로젝트 의뢰</JellyButton>
          </Link>
        </div>
      </div>

      {/* My Orders */}
      <div id="orders">
        <h2 className="text-lg font-bold mb-4">내 주문</h2>
        {orders.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">아직 주문한 서비스가 없습니다.</p>
              <Link href="/services">
                <JellyButton size="sm">서비스 둘러보기</JellyButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const statusStyle = ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.pending;
              return (
                <GlassCard key={order.id} className="hover:shadow-md transition-shadow">
                  <GlassCardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusStyle!.className}`}>
                        {statusStyle!.label}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.packageTier.charAt(0).toUpperCase() + order.packageTier.slice(1)} 패키지
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt.toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold">{formatKRW(order.price)}</span>
                      {order.projectId && (
                        <Link
                          href={`/project/${order.projectId}`}
                          className="text-xs text-peach-500 hover:text-peach-600"
                        >
                          프로젝트 →
                        </Link>
                      )}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* My Projects */}
      <div id="projects">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">내 프로젝트</h2>
          <Link href="/project/new" className="text-sm text-peach-500 hover:text-peach-600">
            + 프로젝트 등록
          </Link>
        </div>
        {projects.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">아직 등록한 프로젝트가 없습니다.</p>
              <Link href="/project/new">
                <JellyButton size="sm">첫 프로젝트 등록하기</JellyButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <GlassCard className="transition-all hover:shadow-lg hover:scale-[1.005]">
                  <GlassCardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={project.status as ProjectStatus} />
                      <span className="font-medium text-sm">{project.title}</span>
                    </div>
                    <MoneyRange min={project.budgetMin} max={project.budgetMax} size="sm" />
                  </GlassCardContent>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Browse Services CTA */}
      <GlassCard>
        <GlassCardContent className="py-8 text-center">
          <h3 className="text-lg font-bold mb-2">AI 영상 서비스 찾기</h3>
          <p className="text-sm text-muted-foreground mb-4">
            전문 크리에이터의 서비스를 둘러보고 바로 구매해보세요.
          </p>
          <Link href="/services">
            <JellyButton gradient="mixed">서비스 둘러보기</JellyButton>
          </Link>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
