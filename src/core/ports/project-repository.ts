import type { ProjectData, CreateProjectInput, UpdateProjectInput, VideoBriefData, CreateVideoBriefInput } from '@/core/types/project';

export interface ProjectRepository {
  findById(id: string): Promise<ProjectData | null>;
  findByClientId(clientId: string): Promise<ProjectData[]>;
  findOpen(limit?: number): Promise<ProjectData[]>;
  create(input: CreateProjectInput): Promise<ProjectData>;
  update(id: string, input: UpdateProjectInput): Promise<ProjectData>;
}

export interface VideoBriefRepository {
  findByProjectId(projectId: string): Promise<VideoBriefData | null>;
  create(input: CreateVideoBriefInput): Promise<VideoBriefData>;
  update(id: string, input: Partial<CreateVideoBriefInput>): Promise<VideoBriefData>;
}
