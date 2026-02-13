import { z } from 'zod';

// ─── Status & Tier enums ───
export const serviceStatusSchema = z.enum(['draft', 'active', 'paused', 'deleted']);
export const packageTierSchema = z.enum(['basic', 'standard', 'premium']);

// ─── Category options (AI 영상 용도 기반 9개) ───
export const SERVICE_CATEGORIES = [
  { value: 'short_form', label: '숏폼', icon: '📱', description: '60초 이하 숏폼 영상' },
  { value: 'ad_commercial', label: '광고/커머셜', icon: '📺', description: '제품·서비스 광고 영상' },
  { value: 'music_video', label: '뮤직비디오', icon: '🎵', description: 'AI 뮤직비디오 제작' },
  { value: 'product_intro', label: '제품소개', icon: '🎁', description: '제품 홍보·소개 영상' },
  { value: 'explainer', label: '설명영상', icon: '💡', description: '교육·설명 콘텐츠' },
  { value: 'motion_graphics', label: '모션그래픽', icon: '✨', description: '모션그래픽·인포그래픽' },
  { value: 'vfx', label: 'VFX/특수효과', icon: '🔥', description: 'VFX·특수효과 합성' },
  { value: 'ai_art', label: 'AI 아트', icon: '🎨', description: 'AI 아트·일러스트 영상' },
  { value: 'other', label: '기타', icon: '🎬', description: '기타 AI 영상' },
] as const;

export const serviceCategorySchema = z.string().min(1, '카테고리를 선택해주세요.');

// ─── Package schema ───
export const servicePackageSchema = z.object({
  tier: packageTierSchema,
  title: z.string().min(1, '패키지 제목을 입력해주세요.').max(50, '패키지 제목은 50자 이하여야 합니다.'),
  description: z.string().min(1, '패키지 설명을 입력해주세요.').max(500, '패키지 설명은 500자 이하여야 합니다.'),
  price: z.number({ message: '가격을 입력해주세요.' }).int({ message: '가격은 정수여야 합니다.' }).min(10000, '최소 가격은 ₩10,000입니다.'),
  deliveryDays: z.number({ message: '납기일을 입력해주세요.' }).int({ message: '납기일은 정수여야 합니다.' }).min(1, '최소 1일입니다.'),
  revisions: z.number({ message: '수정 횟수를 입력해주세요.' }).int({ message: '수정 횟수는 정수여야 합니다.' }).min(0, '수정 횟수는 0 이상이어야 합니다.'),
  videoLength: z.string().min(1, '영상 길이를 입력해주세요.'),
  features: z.array(z.string()).default([]),
});

// ─── Step 1: Basic info ───
export const serviceBasicSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 5자 이상이어야 합니다.')
    .max(100, '제목은 100자 이하여야 합니다.'),
  description: z
    .string()
    .min(20, '설명은 20자 이상이어야 합니다.')
    .max(5000, '설명은 5000자 이하여야 합니다.'),
  category: serviceCategorySchema,
  tags: z.array(z.string()).max(10, '태그는 최대 10개까지 가능합니다.').default([]),
});

// ─── Step 2: Packages ───
export const servicePackagesSchema = z
  .array(servicePackageSchema)
  .min(1, '최소 1개의 패키지가 필요합니다.')
  .max(3, '패키지는 최대 3개까지 가능합니다.');

// ─── Step 4: FAQ ───
export const serviceFaqSchema = z
  .array(
    z.object({
      question: z.string().min(1, '질문을 입력해주세요.'),
      answer: z.string().min(1, '답변을 입력해주세요.'),
    }),
  )
  .default([]);

// ─── Combined: Full service creation payload ───
export const createServicePayloadSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  category: z.string().min(1),
  packages: servicePackagesSchema,
  tags: z.array(z.string()).max(10).default([]),
  faq: serviceFaqSchema,
  thumbnailUrl: z.string().optional(),
  galleryUrls: z.array(z.string()).default([]),
});

// ─── Type inference ───
export type ServiceBasicInput = z.infer<typeof serviceBasicSchema>;
export type ServicePackageInput = z.infer<typeof servicePackageSchema>;
export type CreateServicePayload = z.infer<typeof createServicePayloadSchema>;
