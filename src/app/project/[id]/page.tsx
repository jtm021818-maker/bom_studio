import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyDisplay, MoneyRange } from '@/components/shared/MoneyDisplay';
import { TimelineGate } from '@/components/shared/TimelineGate';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SowGenerator } from '@/components/project/SowGenerator';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { projectRepository, videoBriefRepository } from '@/adapters/db/repositories/project';
import { proposalRepository } from '@/adapters/db/repositories/proposal';
import { milestoneRepository } from '@/adapters/db/repositories/milestone';
import { reviewRepository } from '@/adapters/db/repositories/review';
import {
  CHANNEL_LABELS,
  PROJECT_CATEGORIES,
} from '@/core/validators/project';
import type { ProjectStatus } from '@/core/types/project';
import type { ProposalStatus } from '@/core/types/proposal';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  const project = await projectRepository.findById(id);
  if (!project) {
    notFound();
  }

  // Fetch related data in parallel
  const [videoBrief, proposals, milestones, reviews, sessionUser] = await Promise.all([
    videoBriefRepository.findByProjectId(id),
    proposalRepository.findByProjectId(id),
    milestoneRepository.findByProjectId(id),
    reviewRepository.findByProjectId(id),
    createServerSupabaseClient().then(s => s.auth.getUser()).then(r => r.data.user).catch(() => null),
  ]);

  const categoryLabel = PROJECT_CATEGORIES.find((c) => c.value === project.category)?.label ?? project.category;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status as ProjectStatus} />
              <Badge variant="secondary">{categoryLabel}</Badge>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>등록일: {project.createdAt.toLocaleDateString('ko-KR')}</p>
            <p>마감일: {project.deadline.toLocaleDateString('ko-KR')}</p>
          </div>
        </div>

        {/* Project Details */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">프로젝트 상세</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">설명</h3>
              <p className="text-sm whitespace-pre-wrap">{project.description}</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">예산 범위</h3>
                <MoneyRange min={project.budgetMin} max={project.budgetMax} size="lg" />
              </div>
              <div className="text-right">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">마감일</h3>
                <p className="text-lg font-semibold">
                  {project.deadline.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Video Brief */}
        {videoBrief && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-lg">영상 브리프</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">채널</span>
                  <p className="font-medium">{CHANNEL_LABELS[videoBrief.channel] ?? videoBrief.channel}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">영상 길이</span>
                  <p className="font-medium">{videoBrief.duration}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">해상도</span>
                  <p className="font-medium">{videoBrief.resolution}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">화면 비율</span>
                  <p className="font-medium">{videoBrief.aspectRatio}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">FPS</span>
                  <p className="font-medium">{videoBrief.fps}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div>
                <span className="text-sm text-muted-foreground">스타일</span>
                <p className="text-sm mt-1">{videoBrief.style}</p>
              </div>
              {videoBrief.prohibitedElements && videoBrief.prohibitedElements.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-muted-foreground">금지 요소</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {videoBrief.prohibitedElements.map((el, idx) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {el}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {videoBrief.referenceUrls && videoBrief.referenceUrls.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-muted-foreground">참고 URL</span>
                  <ul className="mt-1 space-y-1">
                    {videoBrief.referenceUrls.map((url, idx) => (
                      <li key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}

        {/* AI SOW Generator */}
        <SowGenerator projectId={id} />

        {/* Proposals Section */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">
              제안서 ({proposals.length}건)
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {proposals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 제안서가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={proposal.status as ProposalStatus} />
                        <span className="text-sm text-muted-foreground">
                          {proposal.deliveryDays}일 납품
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {proposal.milestones}
                      </p>
                    </div>
                    <MoneyDisplay amount={proposal.price} size="lg" />
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Milestones Timeline */}
        {milestones.length > 0 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-lg">
                마일스톤 진행 ({milestones.length}건)
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <TimelineGate
                milestones={milestones.map((ms) => ({
                  title: ms.title,
                  status: ms.status,
                  amount: ms.amount,
                }))}
              />
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Chat Panel */}
        {sessionUser && (
          <ChatPanel projectId={id} currentUserId={sessionUser.id} />
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-lg">
                리뷰 ({reviews.length}건)
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {review.createdAt.toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
