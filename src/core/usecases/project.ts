import type { ProjectRepository, VideoBriefRepository } from '@/core/ports/project-repository';
import type { ProjectData, CreateProjectInput, UpdateProjectInput, VideoBriefData, CreateVideoBriefInput } from '@/core/types/project';

export function createProjectUseCases(
  projectRepo: ProjectRepository,
  videoBriefRepo: VideoBriefRepository
) {
  return {
    async getProject(id: string): Promise<ProjectData | null> {
      return projectRepo.findById(id);
    },

    async listClientProjects(clientId: string): Promise<ProjectData[]> {
      return projectRepo.findByClientId(clientId);
    },

    async listOpenProjects(limit?: number): Promise<ProjectData[]> {
      return projectRepo.findOpen(limit);
    },

    async createProject(input: CreateProjectInput): Promise<ProjectData> {
      return projectRepo.create(input);
    },

    async updateProject(id: string, input: UpdateProjectInput): Promise<ProjectData> {
      return projectRepo.update(id, input);
    },

    async publishProject(id: string): Promise<ProjectData> {
      return projectRepo.update(id, { status: 'open' });
    },

    async getVideoBrief(projectId: string): Promise<VideoBriefData | null> {
      return videoBriefRepo.findByProjectId(projectId);
    },

    async createVideoBrief(input: CreateVideoBriefInput): Promise<VideoBriefData> {
      return videoBriefRepo.create(input);
    },

    async updateVideoBrief(id: string, input: Partial<CreateVideoBriefInput>): Promise<VideoBriefData> {
      return videoBriefRepo.update(id, input);
    },
  };
}
