export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardFooter } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyRange } from '@/components/shared/MoneyDisplay';
import { Badge } from '@/components/ui/badge';
import { JellyButton } from '@/components/shared/JellyButton';
import { projectRepository } from '@/adapters/db/repositories/project';
import { PROJECT_CATEGORIES } from '@/core/validators/project';
import type { ProjectStatus } from '@/core/types/project';

export default async function ExploreProjectsPage() {
  const projects = await projectRepository.findOpen(20);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">프로젝트 탐색</h1>
            <p className="text-muted-foreground text-sm mt-1">
              현재 모집 중인 AI 영상 제작 프로젝트를 찾아보세요.
            </p>
          </div>
          <Link href="/project/new">
            <JellyButton>프로젝트 등록</JellyButton>
          </Link>
        </div>

        {/* Project List */}
        {projects.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground mb-2">
                아직 모집 중인 프로젝트가 없습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                첫 번째 프로젝트를 등록해 보세요!
              </p>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const categoryLabel = PROJECT_CATEGORIES.find((c) => c.value === project.category)?.label ?? project.category;
              const daysLeft = Math.ceil(
                (project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Link key={project.id} href={`/project/${project.id}`} className="group">
                  <GlassCard className="h-full transition-all group-hover:shadow-lg group-hover:scale-[1.01]">
                    <GlassCardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <GlassCardTitle className="text-base line-clamp-2 leading-snug">
                          {project.title}
                        </GlassCardTitle>
                        <StatusBadge status={project.status as ProjectStatus} />
                      </div>
                      <GlassCardDescription className="line-clamp-2 text-xs">
                        {project.description}
                      </GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent className="pt-0 space-y-2">
                      <div>
                        <MoneyRange min={project.budgetMin} max={project.budgetMax} size="sm" className="font-semibold" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{categoryLabel}</Badge>
                        <span className={`text-xs ${daysLeft <= 3 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
                        </span>
                      </div>
                    </GlassCardContent>
                    <GlassCardFooter className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {project.createdAt.toLocaleDateString('ko-KR')} 등록
                      </p>
                    </GlassCardFooter>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
