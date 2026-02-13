import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { projectRepository } from '@/adapters/db/repositories/project';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyRange } from '@/components/shared/MoneyDisplay';
import type { ProjectStatus } from '@/core/types/project';

export default async function ClientDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) redirect('/auth');

  const projects = await projectRepository.findByClientId(profile.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">의뢰인 대시보드</h2>
          <Link href="/project/new"><JellyButton>새 프로젝트 등록</JellyButton></Link>
        </div>

        {projects.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground mb-4">아직 등록한 프로젝트가 없습니다.</p>
              <Link href="/project/new"><JellyButton>첫 프로젝트 등록하기</JellyButton></Link>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <GlassCard>
                <GlassCardHeader><GlassCardTitle className="text-lg">크리에이터 탐색</GlassCardTitle></GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-muted-foreground mb-3">AI 영상 제작 크리에이터를 찾아보세요.</p>
                  <Link href="/explore/creators"><JellyButton size="sm" gradient="serenity">탐색하기</JellyButton></Link>
                </GlassCardContent>
              </GlassCard>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">내 프로젝트</h3>
              <div className="grid gap-3">
                {projects.map((project) => (
                  <Link key={project.id} href={`/project/${project.id}`}>
                    <GlassCard className="transition-all hover:shadow-lg hover:scale-[1.005]">
                      <GlassCardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={project.status as ProjectStatus} />
                          <span className="font-medium">{project.title}</span>
                        </div>
                        <MoneyRange min={project.budgetMin} max={project.budgetMax} size="sm" />
                      </GlassCardContent>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
