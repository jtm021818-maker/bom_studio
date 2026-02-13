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
  SERVICE_CATEGORIES,
  serviceBasicSchema,
  servicePackagesSchema,
  serviceFaqSchema,
} from '@/core/validators/service';
import type { PackageTier } from '@/core/types/service';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_TITLES: Record<Step, string> = {
  1: '기본 정보',
  2: '패키지 설정',
  3: '갤러리',
  4: 'FAQ',
  5: '미리보기',
};

const TIERS: { tier: PackageTier; label: string }[] = [
  { tier: 'basic', label: 'Basic' },
  { tier: 'standard', label: 'Standard' },
  { tier: 'premium', label: 'Premium' },
];

interface PackageForm {
  tier: PackageTier;
  title: string;
  description: string;
  price: string;
  deliveryDays: string;
  revisions: string;
  videoLength: string;
  features: string;
}

const emptyPackage = (tier: PackageTier): PackageForm => ({
  tier,
  title: tier === 'basic' ? 'Basic' : tier === 'standard' ? 'Standard' : 'Premium',
  description: '',
  price: '',
  deliveryDays: '',
  revisions: '',
  videoLength: '',
  features: '',
});

export default function NewServicePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Step 2
  const [packages, setPackages] = useState<PackageForm[]>([
    emptyPackage('basic'),
    emptyPackage('standard'),
    emptyPackage('premium'),
  ]);

  // Step 3
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(['']);

  // Step 4
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([]);

  const clearErrors = useCallback(() => setErrors({}), []);

  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag) && tags.length < 10) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));

  const updatePackage = (idx: number, field: keyof PackageForm, value: string) => {
    setPackages(packages.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addGalleryUrl = () => setGalleryUrls([...galleryUrls, '']);
  const updateGalleryUrl = (idx: number, value: string) => {
    setGalleryUrls(galleryUrls.map((u, i) => i === idx ? value : u));
  };
  const removeGalleryUrl = (idx: number) => setGalleryUrls(galleryUrls.filter((_, i) => i !== idx));

  const addFaq = () => setFaqItems([...faqItems, { question: '', answer: '' }]);
  const updateFaq = (idx: number, field: 'question' | 'answer', value: string) => {
    setFaqItems(faqItems.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };
  const removeFaq = (idx: number) => setFaqItems(faqItems.filter((_, i) => i !== idx));

  const validateStep1 = (): boolean => {
    const result = serviceBasicSchema.safeParse({ title, description, category, tags });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string') fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep2 = (): boolean => {
    const parsed = packages
      .filter((p) => p.price || p.description)
      .map((p) => ({
        tier: p.tier,
        title: p.title,
        description: p.description,
        price: parseInt(p.price, 10) || 0,
        deliveryDays: parseInt(p.deliveryDays, 10) || 0,
        revisions: parseInt(p.revisions, 10) || 0,
        videoLength: p.videoLength,
        features: p.features ? p.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
      }));
    const result = servicePackagesSchema.safeParse(parsed);
    if (!result.success) {
      setErrors({ packages: result.error.issues[0]?.message ?? '패키지 정보를 확인해주세요.' });
      return false;
    }
    clearErrors();
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3) { clearErrors(); setStep(4); }
    else if (step === 4) { clearErrors(); setStep(5); }
  };

  const handleBack = () => {
    clearErrors();
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});

    try {
      const pkgs = packages
        .filter((p) => p.price || p.description)
        .map((p) => ({
          tier: p.tier,
          title: p.title,
          description: p.description,
          price: parseInt(p.price, 10) || 0,
          deliveryDays: parseInt(p.deliveryDays, 10) || 0,
          revisions: parseInt(p.revisions, 10) || 0,
          videoLength: p.videoLength,
          features: p.features ? p.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
        }));

      const payload = {
        title,
        description,
        category,
        tags,
        packages: pkgs,
        thumbnailUrl: thumbnailUrl || undefined,
        galleryUrls: galleryUrls.filter(Boolean),
        faq: faqItems.filter((f) => f.question && f.answer),
      };

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? '서비스 생성에 실패했습니다.');
      }

      const service = await res.json() as { id: string };
      router.push(`/service/${service.id}`);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : '오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {([1, 2, 3, 4, 5] as const).map((s) => (
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
              {s < 5 && <div className="w-4 sm:w-8 h-px bg-gray-200 mx-1 hidden sm:block" />}
            </div>
          ))}
        </div>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{STEP_TITLES[step]}</GlassCardTitle>
            <GlassCardDescription>
              {step === 1 && '서비스의 기본 정보를 입력해주세요.'}
              {step === 2 && 'Basic/Standard/Premium 패키지 가격을 설정해주세요.'}
              {step === 3 && '서비스 썸네일과 갤러리를 등록해주세요. (선택)'}
              {step === 4 && '자주 묻는 질문을 등록해주세요. (선택)'}
              {step === 5 && '입력하신 내용을 확인하고 서비스를 등록해주세요.'}
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">서비스 제목</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: AI 숏폼 영상 전문 제작" maxLength={100} />
                  {errors['title'] && <p className="text-sm text-destructive">{errors['title']}</p>}
                </div>
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          category === cat.value
                            ? 'border-peach-400 bg-peach-50 text-peach-600 font-medium'
                            : 'border-border hover:border-peach-200'
                        }`}
                      >
                        <div className="text-xl mb-1">{cat.icon}</div>
                        <div className="text-xs">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                  {errors['category'] && <p className="text-sm text-destructive">{errors['category']}</p>}
                </div>
                <div className="space-y-2">
                  <Label>태그 (최대 10개)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="태그 입력 후 추가"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    />
                    <Button type="button" variant="outline" onClick={addTag} size="sm">추가</Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs">
                          {tag}
                          <button type="button" onClick={() => removeTag(i)} className="text-gray-400 hover:text-gray-600">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">서비스 설명</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="서비스에 대해 자세히 설명해주세요." rows={6} maxLength={5000} />
                  <p className="text-xs text-muted-foreground text-right">{description.length}/5000</p>
                  {errors['description'] && <p className="text-sm text-destructive">{errors['description']}</p>}
                </div>
              </>
            )}

            {/* Step 2: Packages */}
            {step === 2 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 w-24"></th>
                        {TIERS.map((t) => (
                          <th key={t.tier} className="text-center py-2 px-2 font-semibold">
                            {t.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      {(['description', 'price', 'deliveryDays', 'revisions', 'videoLength', 'features'] as const).map((field) => (
                        <tr key={field} className="border-b border-gray-50">
                          <td className="py-2 pr-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {field === 'description' && '설명'}
                            {field === 'price' && '가격 (원)'}
                            {field === 'deliveryDays' && '납기 (일)'}
                            {field === 'revisions' && '수정 횟수'}
                            {field === 'videoLength' && '영상 길이'}
                            {field === 'features' && '기능 (쉼표)'}
                          </td>
                          {packages.map((pkg, i) => (
                            <td key={pkg.tier} className="py-2 px-1">
                              {field === 'description' ? (
                                <Textarea value={pkg[field]} onChange={(e) => updatePackage(i, field, e.target.value)} placeholder="패키지 설명" rows={2} className="text-xs" />
                              ) : (
                                <Input
                                  type={['price', 'deliveryDays', 'revisions'].includes(field) ? 'number' : 'text'}
                                  value={pkg[field]}
                                  onChange={(e) => updatePackage(i, field, e.target.value)}
                                  placeholder={
                                    field === 'price' ? '50000' :
                                    field === 'deliveryDays' ? '7' :
                                    field === 'revisions' ? '1' :
                                    field === 'videoLength' ? '30초' :
                                    field === 'features' ? '기본 편집, 자막' : ''
                                  }
                                  className="text-xs"
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {errors['packages'] && <p className="text-sm text-destructive">{errors['packages']}</p>}
              </>
            )}

            {/* Step 3: Gallery */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>썸네일 URL</Label>
                  <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://example.com/thumbnail.jpg" />
                </div>
                <div className="space-y-2">
                  <Label>갤러리 URL</Label>
                  {galleryUrls.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={url} onChange={(e) => updateGalleryUrl(i, e.target.value)} placeholder="https://example.com/image.jpg" />
                      {galleryUrls.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeGalleryUrl(i)}>×</Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addGalleryUrl}>+ URL 추가</Button>
                </div>
              </>
            )}

            {/* Step 4: FAQ */}
            {step === 4 && (
              <>
                {faqItems.map((faq, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <Label>FAQ #{i + 1}</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-600">삭제</Button>
                    </div>
                    <Input value={faq.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} placeholder="질문을 입력하세요" />
                    <Textarea value={faq.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} placeholder="답변을 입력하세요" rows={2} />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFaq}>+ 질문 추가</Button>
              </>
            )}

            {/* Step 5: Preview */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">기본 정보</h3>
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs">카테고리: {SERVICE_CATEGORIES.find((c) => c.value === category)?.label ?? category}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, i) => <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">{tag}</span>)}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">패키지</h3>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {packages.filter((p) => p.price).map((pkg) => (
                      <div key={pkg.tier} className="space-y-1">
                        <p className="font-semibold">{pkg.title}</p>
                        <p>₩{parseInt(pkg.price, 10).toLocaleString('ko-KR')}</p>
                        <p>{pkg.deliveryDays}일 / 수정 {pkg.revisions}회</p>
                        <p>{pkg.videoLength}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {faqItems.length > 0 && (
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">FAQ</h3>
                    {faqItems.filter((f) => f.question).map((faq, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">Q. {faq.question}</p>
                        <p className="text-muted-foreground">A. {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
                {errors['form'] && <p className="text-sm text-destructive">{errors['form']}</p>}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack}>이전</Button>
              ) : (
                <Button variant="outline" onClick={() => router.back()}>취소</Button>
              )}
              {step < 5 ? (
                <JellyButton onClick={handleNext}>다음</JellyButton>
              ) : (
                <JellyButton onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '등록 중...' : '서비스 등록'}
                </JellyButton>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
