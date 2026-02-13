import { describe, it, expect } from 'vitest';
import {
  projectBasicSchema,
  projectBudgetSchema,
  videoBriefSchema,
  createProjectPayloadSchema,
} from '@/core/validators/project';

describe('projectBasicSchema', () => {
  it('accepts valid basic input', () => {
    const result = projectBasicSchema.safeParse({
      title: 'AI 뮤직비디오 제작 의뢰',
      description: '몽환적인 AI 아트 스타일의 3분 뮤직비디오를 제작해 주실 크리에이터를 찾습니다.',
      category: 'music_video',
    });
    expect(result.success).toBe(true);
  });

  it('rejects title under 5 chars', () => {
    const result = projectBasicSchema.safeParse({
      title: '짧음',
      description: '충분히 긴 설명입니다. 20자 이상이어야 합니다.',
      category: 'music_video',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description under 20 chars', () => {
    const result = projectBasicSchema.safeParse({
      title: '충분히 긴 제목입니다',
      description: '짧음',
      category: 'music_video',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty category', () => {
    const result = projectBasicSchema.safeParse({
      title: '충분히 긴 제목입니다',
      description: '충분히 긴 설명입니다. 20자 이상이어야 합니다.',
      category: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('projectBudgetSchema', () => {
  it('accepts valid budget and deadline', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = projectBudgetSchema.safeParse({
      budgetMin: 100000,
      budgetMax: 500000,
      deadline: futureDate.toISOString().split('T')[0],
    });
    expect(result.success).toBe(true);
  });

  it('rejects budgetMin below 10000', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = projectBudgetSchema.safeParse({
      budgetMin: 5000,
      budgetMax: 500000,
      deadline: futureDate.toISOString().split('T')[0],
    });
    expect(result.success).toBe(false);
  });

  it('rejects budgetMax less than budgetMin', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = projectBudgetSchema.safeParse({
      budgetMin: 500000,
      budgetMax: 100000,
      deadline: futureDate.toISOString().split('T')[0],
    });
    expect(result.success).toBe(false);
  });

  it('rejects past deadline', () => {
    const result = projectBudgetSchema.safeParse({
      budgetMin: 100000,
      budgetMax: 500000,
      deadline: '2020-01-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('videoBriefSchema', () => {
  it('accepts valid video brief', () => {
    const result = videoBriefSchema.safeParse({
      channel: 'youtube_short',
      duration: '30초',
      resolution: '1080p',
      aspectRatio: '9:16',
      fps: '30',
      style: '사이버펑크 AI 아트 스타일',
    });
    expect(result.success).toBe(true);
  });

  it('accepts with optional fields', () => {
    const result = videoBriefSchema.safeParse({
      channel: 'instagram_reel',
      duration: '60초',
      resolution: '1080p',
      aspectRatio: '9:16',
      fps: '30',
      style: '몽환적 파스텔 톤',
      prohibitedElements: ['실사 인물', '폭력적 장면'],
      referenceUrls: ['https://youtube.com/watch?v=abc'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid channel', () => {
    const result = videoBriefSchema.safeParse({
      channel: 'invalid_channel',
      duration: '30초',
      resolution: '1080p',
      aspectRatio: '9:16',
      fps: '30',
      style: '스타일',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty style', () => {
    const result = videoBriefSchema.safeParse({
      channel: 'youtube_short',
      duration: '30초',
      resolution: '1080p',
      aspectRatio: '9:16',
      fps: '30',
      style: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid reference URL', () => {
    const result = videoBriefSchema.safeParse({
      channel: 'youtube_short',
      duration: '30초',
      resolution: '1080p',
      aspectRatio: '9:16',
      fps: '30',
      style: '스타일 설명',
      referenceUrls: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });
});

describe('createProjectPayloadSchema', () => {
  it('accepts full valid payload', () => {
    const result = createProjectPayloadSchema.safeParse({
      title: 'AI 뮤직비디오 제작 의뢰',
      description: '몽환적인 AI 아트 스타일의 3분 뮤직비디오를 제작해 주실 크리에이터를 찾습니다.',
      category: 'music_video',
      budgetMin: 500000,
      budgetMax: 1500000,
      deadline: '2026-03-15',
      videoBrief: {
        channel: 'youtube_short',
        duration: '60초',
        resolution: '1080p',
        aspectRatio: '9:16',
        fps: '30',
        style: '사이버펑크',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts payload without videoBrief', () => {
    const result = createProjectPayloadSchema.safeParse({
      title: 'AI 뮤직비디오 제작 의뢰',
      description: '몽환적인 AI 아트 스타일의 3분 뮤직비디오를 제작해 주실 크리에이터를 찾습니다.',
      category: 'music_video',
      budgetMin: 500000,
      budgetMax: 1500000,
      deadline: '2026-03-15',
    });
    expect(result.success).toBe(true);
  });
});
