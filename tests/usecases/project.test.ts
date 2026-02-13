import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProjectUseCases } from '@/core/usecases/project';
import type { ProjectRepository, VideoBriefRepository } from '@/core/ports/project-repository';
import type { ProjectData, VideoBriefData } from '@/core/types/project';

// ─── Mock Data ───
const NOW = new Date('2026-02-12T00:00:00Z');
const DEADLINE = new Date('2026-03-15T00:00:00Z');

const mockProject: ProjectData = {
  id: 'proj-1',
  clientId: 'client-1',
  title: 'AI 뮤직비디오 제작',
  description: '몽환적인 AI 아트 스타일의 3분 뮤직비디오 제작을 의뢰합니다.',
  status: 'draft',
  budgetMin: 500000,
  budgetMax: 1500000,
  deadline: DEADLINE,
  category: 'music_video',
  createdAt: NOW,
};

const mockOpenProject: ProjectData = {
  ...mockProject,
  id: 'proj-2',
  status: 'open',
  title: '숏폼 콘텐츠 제작',
};

const mockVideoBrief: VideoBriefData = {
  id: 'brief-1',
  projectId: 'proj-1',
  channel: 'youtube_short',
  duration: '60초',
  resolution: '1080p',
  aspectRatio: '9:16',
  fps: '30',
  style: '사이버펑크 AI 아트',
  prohibitedElements: ['실사 인물'],
  referenceUrls: ['https://youtube.com/watch?v=example'],
};

// ─── Mock Repositories ───
function createMockProjectRepo(): ProjectRepository {
  return {
    findById: vi.fn(),
    findByClientId: vi.fn(),
    findOpen: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

function createMockVideoBriefRepo(): VideoBriefRepository {
  return {
    findByProjectId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

describe('createProjectUseCases', () => {
  let projectRepo: ReturnType<typeof createMockProjectRepo>;
  let videoBriefRepo: ReturnType<typeof createMockVideoBriefRepo>;
  let useCases: ReturnType<typeof createProjectUseCases>;

  beforeEach(() => {
    projectRepo = createMockProjectRepo();
    videoBriefRepo = createMockVideoBriefRepo();
    useCases = createProjectUseCases(projectRepo, videoBriefRepo);
  });

  // ─── getProject ───
  describe('getProject', () => {
    it('returns project when found', async () => {
      vi.mocked(projectRepo.findById).mockResolvedValue(mockProject);

      const result = await useCases.getProject('proj-1');

      expect(result).toEqual(mockProject);
      expect(projectRepo.findById).toHaveBeenCalledWith('proj-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(projectRepo.findById).mockResolvedValue(null);

      const result = await useCases.getProject('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── listClientProjects ───
  describe('listClientProjects', () => {
    it('returns all projects for a client', async () => {
      vi.mocked(projectRepo.findByClientId).mockResolvedValue([mockProject, mockOpenProject]);

      const result = await useCases.listClientProjects('client-1');

      expect(result).toHaveLength(2);
      expect(projectRepo.findByClientId).toHaveBeenCalledWith('client-1');
    });

    it('returns empty array when client has no projects', async () => {
      vi.mocked(projectRepo.findByClientId).mockResolvedValue([]);

      const result = await useCases.listClientProjects('client-no-projects');

      expect(result).toEqual([]);
    });
  });

  // ─── listOpenProjects ───
  describe('listOpenProjects', () => {
    it('returns open projects with default limit', async () => {
      vi.mocked(projectRepo.findOpen).mockResolvedValue([mockOpenProject]);

      const result = await useCases.listOpenProjects();

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe('open');
      expect(projectRepo.findOpen).toHaveBeenCalledWith(undefined);
    });

    it('respects custom limit parameter', async () => {
      vi.mocked(projectRepo.findOpen).mockResolvedValue([]);

      await useCases.listOpenProjects(5);

      expect(projectRepo.findOpen).toHaveBeenCalledWith(5);
    });
  });

  // ─── createProject ───
  describe('createProject', () => {
    it('creates project with correct input', async () => {
      const input = {
        clientId: 'client-1',
        title: 'AI 뮤직비디오 제작',
        description: '몽환적인 AI 아트 스타일의 3분 뮤직비디오 제작을 의뢰합니다.',
        budgetMin: 500000,
        budgetMax: 1500000,
        deadline: DEADLINE,
        category: 'music_video',
      };
      vi.mocked(projectRepo.create).mockResolvedValue(mockProject);

      const result = await useCases.createProject(input);

      expect(result).toEqual(mockProject);
      expect(projectRepo.create).toHaveBeenCalledWith(input);
    });

    it('propagates repository errors', async () => {
      vi.mocked(projectRepo.create).mockRejectedValue(new Error('DB error'));

      await expect(useCases.createProject({
        clientId: 'client-1',
        title: 'Test',
        description: 'Test description',
        budgetMin: 100000,
        budgetMax: 500000,
        deadline: DEADLINE,
        category: 'other',
      })).rejects.toThrow('DB error');
    });
  });

  // ─── updateProject ───
  describe('updateProject', () => {
    it('updates project fields', async () => {
      const updated = { ...mockProject, title: '수정된 제목' };
      vi.mocked(projectRepo.update).mockResolvedValue(updated);

      const result = await useCases.updateProject('proj-1', { title: '수정된 제목' });

      expect(result.title).toBe('수정된 제목');
      expect(projectRepo.update).toHaveBeenCalledWith('proj-1', { title: '수정된 제목' });
    });
  });

  // ─── publishProject ───
  describe('publishProject', () => {
    it('sets status to open', async () => {
      const published = { ...mockProject, status: 'open' as const };
      vi.mocked(projectRepo.update).mockResolvedValue(published);

      const result = await useCases.publishProject('proj-1');

      expect(result.status).toBe('open');
      expect(projectRepo.update).toHaveBeenCalledWith('proj-1', { status: 'open' });
    });
  });

  // ─── getVideoBrief ───
  describe('getVideoBrief', () => {
    it('returns video brief when found', async () => {
      vi.mocked(videoBriefRepo.findByProjectId).mockResolvedValue(mockVideoBrief);

      const result = await useCases.getVideoBrief('proj-1');

      expect(result).toEqual(mockVideoBrief);
      expect(videoBriefRepo.findByProjectId).toHaveBeenCalledWith('proj-1');
    });

    it('returns null when not found', async () => {
      vi.mocked(videoBriefRepo.findByProjectId).mockResolvedValue(null);

      const result = await useCases.getVideoBrief('proj-no-brief');

      expect(result).toBeNull();
    });
  });

  // ─── createVideoBrief ───
  describe('createVideoBrief', () => {
    it('creates video brief with all fields', async () => {
      const input = {
        projectId: 'proj-1',
        channel: 'youtube_short' as const,
        duration: '60초',
        resolution: '1080p',
        aspectRatio: '9:16',
        fps: '30',
        style: '사이버펑크 AI 아트',
        prohibitedElements: ['실사 인물'],
        referenceUrls: ['https://youtube.com/watch?v=example'],
      };
      vi.mocked(videoBriefRepo.create).mockResolvedValue(mockVideoBrief);

      const result = await useCases.createVideoBrief(input);

      expect(result).toEqual(mockVideoBrief);
      expect(videoBriefRepo.create).toHaveBeenCalledWith(input);
    });
  });

  // ─── updateVideoBrief ───
  describe('updateVideoBrief', () => {
    it('updates video brief partially', async () => {
      const updated = { ...mockVideoBrief, style: '미니멀 화이트' };
      vi.mocked(videoBriefRepo.update).mockResolvedValue(updated);

      const result = await useCases.updateVideoBrief('brief-1', { style: '미니멀 화이트' });

      expect(result.style).toBe('미니멀 화이트');
      expect(videoBriefRepo.update).toHaveBeenCalledWith('brief-1', { style: '미니멀 화이트' });
    });
  });
});
