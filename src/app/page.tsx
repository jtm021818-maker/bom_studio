import Link from 'next/link';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';

export default function HomePage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto text-center space-y-12 py-16">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="bg-gradient-to-r from-peach-500 to-serenity-500 bg-clip-text text-transparent">
              AI 영상 제작
            </span>
            <br />봄결 스튜디오
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            AI 영상 크리에이터와 의뢰인을 연결합니다. Runway, Sora, Stable Diffusion 등 최신 AI 도구를 활용하는 전문 크리에이터를 만나보세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/project/new">
            <JellyButton gradient="peach" size="lg" className="text-base px-8 py-3">프로젝트 의뢰하기</JellyButton>
          </Link>
          <Link href="/explore/projects">
            <JellyButton gradient="serenity" size="lg" variant="outline" className="text-base px-8 py-3">프로젝트 탐색하기</JellyButton>
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 text-left">
          <GlassCard>
            <GlassCardContent className="py-6 space-y-2">
              <div className="text-2xl">🎨</div>
              <h3 className="font-semibold">AI SOW 자동 생성</h3>
              <p className="text-sm text-muted-foreground">프로젝트 정보만 입력하면 AI가 작업 범위 기술서, 스토리보드, 샷리스트를 자동으로 생성합니다.</p>
            </GlassCardContent>
          </GlassCard>
          <GlassCard>
            <GlassCardContent className="py-6 space-y-2">
              <div className="text-2xl">🔍</div>
              <h3 className="font-semibold">AI 하이브리드 매칭</h3>
              <p className="text-sm text-muted-foreground">벡터 검색과 하드 필터를 결합하여 프로젝트에 가장 적합한 크리에이터를 찾아드립니다.</p>
            </GlassCardContent>
          </GlassCard>
          <GlassCard>
            <GlassCardContent className="py-6 space-y-2">
              <div className="text-2xl">🔒</div>
              <h3 className="font-semibold">안전한 에스크로 결제</h3>
              <p className="text-sm text-muted-foreground">토스페이먼츠 에스크로로 안전하게 결제하고, 전자계약으로 법적 보호를 받으세요.</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        <div className="pt-4">
          <Link href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            이미 계정이 있으신가요? 로그인 →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
