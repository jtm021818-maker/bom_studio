import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { profileRepository, creatorProfileRepository } from '@/adapters/db/repositories/profile';

export default async function CreatorDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) redirect('/auth');

  const creatorProfile = await creatorProfileRepository.findByProfileId(profile.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">크리에이터 대시보드</h2>
          <Link href="/creator/edit">
            <JellyButton gradient="serenity" size="sm">프로필 편집</JellyButton>
          </Link>
        </div>

        {!creatorProfile ? (
          <GlassCard>
            <GlassCardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground mb-4">
                크리에이터 프로필을 먼저 설정해주세요.
              </p>
              <Link href="/creator/edit">
                <JellyButton>프로필 설정하기</JellyButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <GlassCard>
              <GlassCardHeader><GlassCardTitle className="text-lg">프로젝트 탐색</GlassCardTitle></GlassCardHeader>
              <GlassCardContent>
                <p className="text-sm text-muted-foreground mb-3">모집 중인 프로젝트를 찾아 제안서를 보내보세요.</p>
                <Link href="/explore/projects"><JellyButton size="sm" gradient="mixed">탐색하기</JellyButton></Link>
              </GlassCardContent>
            </GlassCard>
            <GlassCard>
              <GlassCardHeader><GlassCardTitle className="text-lg">내 포트폴리오</GlassCardTitle></GlassCardHeader>
              <GlassCardContent>
                <p className="text-sm text-muted-foreground mb-3">포트폴리오를 관리하고 의뢰인에게 어필하세요.</p>
                <Link href={`/creator/${profile.id}`}><JellyButton size="sm" gradient="serenity">보기</JellyButton></Link>
              </GlassCardContent>
            </GlassCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
