import { z } from 'zod';

// ─── Channel & Status enums ───
export const channelSchema = z.enum([
  'youtube_short',
  'youtube_long',
  'instagram_reel',
  'tiktok',
  'other',
]);

export const projectStatusSchema = z.enum([
  'draft',
  'open',
  'in_progress',
  'review',
  'completed',
  'cancelled',
]);

// ─── Category options (predefined for AI video) ───
export const PROJECT_CATEGORIES = [
  { value: 'short_form', label: '숏폼 (60초 이하)' },
  { value: 'long_form', label: '롱폼 (60초 이상)' },
  { value: 'music_video', label: '뮤직비디오' },
  { value: 'ad_commercial', label: '광고/커머셜' },
  { value: 'explainer', label: '설명 영상' },
  { value: 'motion_graphics', label: '모션그래픽' },
  { value: 'vfx', label: 'VFX/특수효과' },
  { value: 'ai_art', label: 'AI 아트' },
  { value: 'other', label: '기타' },
] as const;

export const categorySchema = z.string().min(1, '카테고리를 선택해주세요.');

// ─── Channel display map ───
export const CHANNEL_LABELS: Record<string, string> = {
  youtube_short: '유튜브 숏츠',
  youtube_long: '유튜브 (롱폼)',
  instagram_reel: '인스타그램 릴스',
  tiktok: '틱톡',
  other: '기타',
};

// ─── Step 1: Basic info ───
export const projectBasicSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 5자 이상이어야 합니다.')
    .max(100, '제목은 100자 이하여야 합니다.'),
  description: z
    .string()
    .min(20, '설명은 20자 이상이어야 합니다.')
    .max(2000, '설명은 2000자 이하여야 합니다.'),
  category: categorySchema,
});

// ─── Step 2: Budget & Deadline ───
export const projectBudgetSchema = z
  .object({
    budgetMin: z
      .number({ error: '최소 예산을 입력해주세요.' })
      .int({ error: '예산은 정수여야 합니다.' })
      .min(10000, '최소 예산은 ₩10,000 이상이어야 합니다.'),
    budgetMax: z
      .number({ error: '최대 예산을 입력해주세요.' })
      .int({ error: '예산은 정수여야 합니다.' })
      .min(10000, '최대 예산은 ₩10,000 이상이어야 합니다.'),
    deadline: z
      .string()
      .min(1, '마감일을 선택해주세요.')
      .refine(
        (val) => new Date(val) > new Date(),
        '마감일은 오늘 이후여야 합니다.'
      ),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: '최대 예산은 최소 예산 이상이어야 합니다.',
    path: ['budgetMax'],
  });

// ─── Step 3: Video Brief ───
export const videoBriefSchema = z.object({
  channel: channelSchema,
  duration: z.string().min(1, '영상 길이를 입력해주세요.'),
  resolution: z.string().min(1, '해상도를 선택해주세요.'),
  aspectRatio: z.string().min(1, '화면 비율을 선택해주세요.'),
  fps: z.string().min(1, 'FPS를 선택해주세요.'),
  style: z.string().min(1, '스타일을 입력해주세요.').max(500, '스타일은 500자 이하여야 합니다.'),
  prohibitedElements: z.array(z.string()).optional(),
  referenceUrls: z.array(z.string().url('올바른 URL을 입력해주세요.')).optional(),
});

// ─── Combined: Full project creation payload ───
export const createProjectPayloadSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  category: z.string().min(1),
  budgetMin: z.number().int().min(10000),
  budgetMax: z.number().int().min(10000),
  deadline: z.string().min(1),
  videoBrief: videoBriefSchema.optional(),
});

// ─── Type inference ───
export type ProjectBasicInput = z.infer<typeof projectBasicSchema>;
export type ProjectBudgetInput = z.infer<typeof projectBudgetSchema>;
export type VideoBriefInput = z.infer<typeof videoBriefSchema>;
export type CreateProjectPayload = z.infer<typeof createProjectPayloadSchema>;

// ─── Resolution/AspectRatio/FPS options ───
export const RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p (HD)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '2160p', label: '4K (UHD)' },
] as const;

export const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (가로)' },
  { value: '9:16', label: '9:16 (세로)' },
  { value: '1:1', label: '1:1 (정사각형)' },
  { value: '4:5', label: '4:5 (인스타)' },
] as const;

export const FPS_OPTIONS = [
  { value: '24', label: '24 fps' },
  { value: '30', label: '30 fps' },
  { value: '60', label: '60 fps' },
] as const;
