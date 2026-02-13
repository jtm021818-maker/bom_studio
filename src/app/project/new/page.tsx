'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { AppShell } from '@/components/shared/AppShell';
import {
  projectBasicSchema,
  projectBudgetSchema,
  videoBriefSchema,
  type ProjectBasicInput,
  type ProjectBudgetInput,
  type VideoBriefInput,
  PROJECT_CATEGORIES,
  CHANNEL_LABELS,
  RESOLUTION_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  FPS_OPTIONS,
} from '@/core/validators/project';
import type { Channel } from '@/core/types/project';

type Step = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Step, string> = {
  1: '기본 정보',
  2: '예산 & 마감일',
  3: '영상 브리프',
  4: '최종 확인',
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Step 2: Budget & Deadline
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');

  // Step 3: Video Brief
  const [channel, setChannel] = useState<Channel>('youtube_short');
  const [duration, setDuration] = useState('');
  const [resolution, setResolution] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [fps, setFps] = useState('30');
  const [style, setStyle] = useState('');
  const [prohibitedInput, setProhibitedInput] = useState('');
  const [referenceInput, setReferenceInput] = useState('');

  const clearErrors = useCallback(() => setErrors({}), []);

  const validateStep1 = (): boolean => {
    const result = projectBasicSchema.safeParse({ title, description, category });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep2 = (): boolean => {
    const result = projectBudgetSchema.safeParse({
      budgetMin: budgetMin ? parseInt(budgetMin, 10) : undefined,
      budgetMax: budgetMax ? parseInt(budgetMax, 10) : undefined,
      deadline,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep3 = (): boolean => {
    const result = videoBriefSchema.safeParse({
      channel,
      duration,
      resolution,
      aspectRatio,
      fps,
      style,
      prohibitedElements: prohibitedInput ? prohibitedInput.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      referenceUrls: referenceInput ? referenceInput.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    }
    clearErrors();
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleBack = () => {
    clearErrors();
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});

    try {
      const payload = {
        title,
        description,
        category,
        budgetMin: parseInt(budgetMin, 10),
        budgetMax: parseInt(budgetMax, 10),
        deadline,
        videoBrief: {
          channel,
          duration,
          resolution,
          aspectRatio,
          fps,
          style,
          prohibitedElements: prohibitedInput ? prohibitedInput.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          referenceUrls: referenceInput ? referenceInput.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
        },
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? '프로젝트 생성에 실패했습니다.');
      }

      const project = await res.json() as { id: string };
      router.push(`/project/${project.id}`);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : '오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-gradient-to-r from-peach-400 to-serenity-400 text-white'
                    : s < step
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              <span className={`text-sm hidden sm:inline ${s === step ? 'font-medium' : 'text-muted-foreground'}`}>
                {STEP_TITLES[s]}
              </span>
              {s < 4 && <div className="w-8 h-px bg-gray-200 mx-1 hidden sm:block" />}
            </div>
          ))}
        </div>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{STEP_TITLES[step]}</GlassCardTitle>
            <GlassCardDescription>
              {step === 1 && '프로젝트의 기본 정보를 입력해주세요.'}
              {step === 2 && '예산 범위와 마감일을 설정해주세요.'}
              {step === 3 && '원하시는 영상의 세부 스펙을 입력해주세요.'}
              {step === 4 && '입력하신 내용을 확인하고 프로젝트를 등록해주세요.'}
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">프로젝트 제목</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: AI 뮤직비디오 제작 의뢰"
                    maxLength={100}
                  />
                  {errors['title'] && <p className="text-sm text-destructive">{errors['title']}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">상세 설명</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="프로젝트의 목적, 원하는 결과물, 특별 요구사항 등을 자세히 적어주세요."
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
                  {errors['description'] && <p className="text-sm text-destructive">{errors['description']}</p>}
                </div>
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROJECT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-2 rounded-lg border text-sm text-center transition-all ${
                          category === cat.value
                            ? 'border-peach-400 bg-peach-50 text-peach-600 font-medium'
                            : 'border-border hover:border-peach-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {errors['category'] && <p className="text-sm text-destructive">{errors['category']}</p>}
                </div>
              </>
            )}

            {/* Step 2: Budget & Deadline */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">최소 예산 (원)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="100000"
                      min={10000}
                      step={10000}
                    />
                    {errors['budgetMin'] && <p className="text-sm text-destructive">{errors['budgetMin']}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">최대 예산 (원)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="500000"
                      min={10000}
                      step={10000}
                    />
                    {errors['budgetMax'] && <p className="text-sm text-destructive">{errors['budgetMax']}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">마감일</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors['deadline'] && <p className="text-sm text-destructive">{errors['deadline']}</p>}
                </div>
              </>
            )}

            {/* Step 3: Video Brief */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>채널/플랫폼</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.entries(CHANNEL_LABELS) as [string, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setChannel(key as Channel)}
                        className={`p-2 rounded-lg border text-sm text-center transition-all ${
                          channel === key
                            ? 'border-serenity-400 bg-serenity-50 text-serenity-600 font-medium'
                            : 'border-border hover:border-serenity-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">영상 길이</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="예: 30초, 1분, 3분 이내"
                  />
                  {errors['duration'] && <p className="text-sm text-destructive">{errors['duration']}</p>}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>해상도</Label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {RESOLUTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>화면 비율</Label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>FPS</Label>
                    <select
                      value={fps}
                      onChange={(e) => setFps(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {FPS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style">영상 스타일</Label>
                  <Textarea
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="원하는 영상 스타일을 설명해주세요. 예: 몽환적인 AI 아트 스타일, 사이버펑크 느낌"
                    rows={3}
                  />
                  {errors['style'] && <p className="text-sm text-destructive">{errors['style']}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prohibited">금지 요소 (쉼표로 구분)</Label>
                  <Input
                    id="prohibited"
                    value={prohibitedInput}
                    onChange={(e) => setProhibitedInput(e.target.value)}
                    placeholder="예: 실사 인물, 폭력적 장면, 특정 브랜드"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refs">참고 URL (줄바꿈으로 구분)</Label>
                  <Textarea
                    id="refs"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    placeholder={"https://youtube.com/watch?v=...\nhttps://vimeo.com/..."}
                    rows={3}
                  />
                  {errors['referenceUrls'] && <p className="text-sm text-destructive">{errors['referenceUrls']}</p>}
                </div>
              </>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">기본 정보</h3>
                  <div className="space-y-1">
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
                    <p className="text-xs">
                      카테고리: {PROJECT_CATEGORIES.find((c) => c.value === category)?.label ?? category}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">예산 & 마감일</h3>
                  <p className="text-sm">
                    ₩{parseInt(budgetMin, 10).toLocaleString('ko-KR')} ~ ₩{parseInt(budgetMax, 10).toLocaleString('ko-KR')}
                  </p>
                  <p className="text-sm">마감일: {deadline}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">영상 브리프</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>채널: {CHANNEL_LABELS[channel]}</p>
                    <p>길이: {duration}</p>
                    <p>해상도: {resolution}</p>
                    <p>비율: {aspectRatio}</p>
                    <p>FPS: {fps}</p>
                  </div>
                  <p className="text-sm">스타일: {style}</p>
                  {prohibitedInput && <p className="text-sm">금지: {prohibitedInput}</p>}
                </div>
                {errors['form'] && (
                  <p className="text-sm text-destructive">{errors['form']}</p>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  이전
                </Button>
              ) : (
                <Button variant="outline" onClick={() => router.back()}>
                  취소
                </Button>
              )}
              {step < 4 ? (
                <JellyButton onClick={handleNext}>
                  다음
                </JellyButton>
              ) : (
                <JellyButton onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '등록 중...' : '프로젝트 등록'}
                </JellyButton>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
