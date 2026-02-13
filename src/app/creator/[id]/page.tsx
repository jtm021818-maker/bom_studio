import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { profileRepository, creatorProfileRepository } from '@/adapters/db/repositories/profile';
import { portfolioRepository } from '@/adapters/db/repositories/portfolio';

interface CreatorPageProps {
  params: Promise<{ id: string }>;
}

const AVAILABILITY_LABELS: Record<string, { label: string; className: string }> = {
  available: { label: '작업 가능', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  busy: { label: '작업 중', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  unavailable: { label: '작업 불가', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export default async function CreatorProfilePage({ params }: CreatorPageProps) {
  const { id } = await params;

  // id is the profile ID
  const profile = await profileRepository.findById(id);
  if (!profile || profile.role !== 'creator') {
    notFound();
  }

  const creatorProfile = await creatorProfileRepository.findByProfileId(id);
  if (!creatorProfile) {
    notFound();
  }

  const portfolio = await portfolioRepository.findByCreatorProfileId(creatorProfile.id);

  const availConfig = AVAILABILITY_LABELS[creatorProfile.availability] ?? AVAILABILITY_LABELS['unavailable'];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-peach-200 to-serenity-200 flex items-center justify-center text-xl font-bold text-white">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <RoleBadge role="creator" />
            </div>
            <p className="text-muted-foreground text-sm mt-1">{creatorProfile.intro}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={availConfig?.className}>
                {availConfig?.label}
              </Badge>
              {creatorProfile.hourlyRate && (
                <span className="text-sm text-muted-foreground">{creatorProfile.hourlyRate}</span>
              )}
            </div>
          </div>
        </div>

        {/* Skills & Tools */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">전문 분야</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">스킬</h3>
              <div className="flex flex-wrap gap-1.5">
                {creatorProfile.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">사용 툴</h3>
              <div className="flex flex-wrap gap-1.5">
                {creatorProfile.tools.map((tool, idx) => (
                  <Badge key={idx} variant="outline">{tool}</Badge>
                ))}
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Portfolio */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">포트폴리오</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {portfolio.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 포트폴리오가 등록되지 않았습니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portfolio.map((item) => (
                  <div key={item.id} className="group relative rounded-lg overflow-hidden border border-border">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {item.mediaType === 'image' ? (
                        <div className="w-full h-full bg-gradient-to-br from-peach-100 to-serenity-100 flex items-center justify-center text-xs text-muted-foreground">
                          {item.title}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-2xl">▶</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* External portfolio link */}
        {creatorProfile.portfolioUrl && (
          <GlassCard>
            <GlassCardContent className="py-4">
              <a
                href={creatorProfile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                외부 포트폴리오 보기 →
              </a>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
