'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { JellyButton } from '@/components/shared/JellyButton';
import { Button } from '@/components/ui/button';

type Availability = 'available' | 'busy' | 'unavailable';

export default function EditCreatorProfilePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [intro, setIntro] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [toolsInput, setToolsInput] = useState('');
  const [availability, setAvailability] = useState<Availability>('available');
  const [hourlyRate, setHourlyRate] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const tools = toolsInput.split(',').map((s) => s.trim()).filter(Boolean);

    if (skills.length === 0) {
      setError('최소 1개 이상의 스킬을 입력해주세요.');
      setSaving(false);
      return;
    }

    if (tools.length === 0) {
      setError('최소 1개 이상의 툴을 입력해주세요.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intro,
          skills,
          tools,
          availability,
          hourlyRate: hourlyRate || undefined,
          portfolioUrl: portfolioUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? '크리에이터 프로필 저장에 실패했습니다.');
      }

      router.push('/dashboard/creator');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-xl">크리에이터 프로필 설정</GlassCardTitle>
            <GlassCardDescription>
              프로필 정보를 입력하면 의뢰인이 당신을 검색하고 프로젝트를 의뢰할 수 있습니다.
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intro">자기소개</Label>
                <Textarea
                  id="intro"
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="AI 영상 제작 경험, 전문 분야, 작업 스타일 등을 소개해주세요."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">전문 스킬 (쉼표로 구분)</Label>
                <Input
                  id="skills"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="예: Runway Gen-3, Stable Diffusion, Midjourney, After Effects"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tools">사용 도구 (쉼표로 구분)</Label>
                <Input
                  id="tools"
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  placeholder="예: ComfyUI, Premiere Pro, DaVinci Resolve"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>작업 가능 여부</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'available', label: '작업 가능', emoji: '🟢' },
                    { value: 'busy', label: '작업 중', emoji: '🟡' },
                    { value: 'unavailable', label: '작업 불가', emoji: '🔴' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAvailability(opt.value)}
                      className={`p-2 rounded-lg border text-sm text-center transition-all ${
                        availability === opt.value
                          ? 'border-serenity-400 bg-serenity-50 text-serenity-600 font-medium'
                          : 'border-border hover:border-serenity-200'
                      }`}
                    >
                      <span className="mr-1">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">시간당 단가 (선택)</Label>
                <Input
                  id="hourlyRate"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="예: ₩50,000/시간"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">외부 포트폴리오 URL (선택)</Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  취소
                </Button>
                <JellyButton type="submit" disabled={saving}>
                  {saving ? '저장 중...' : '프로필 저장'}
                </JellyButton>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
