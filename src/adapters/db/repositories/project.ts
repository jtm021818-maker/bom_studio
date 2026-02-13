import { eq, desc, isNull } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { projects, videoBriefs } from '@/adapters/db/schema/projects';
import type { ProjectRepository, VideoBriefRepository } from '@/core/ports/project-repository';
import type { ProjectData, CreateProjectInput, UpdateProjectInput, VideoBriefData, CreateVideoBriefInput } from '@/core/types/project';

export const projectRepository: ProjectRepository = {
  async findById(id: string): Promise<ProjectData | null> {
    const results = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    const row = results[0];
    if (!row) return null;
    return { ...row, deadline: row.deadline, createdAt: row.createdAt };
  },

  async findByClientId(clientId: string): Promise<ProjectData[]> {
    const results = await db.select().from(projects)
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.createdAt));
    return results;
  },

  async findOpen(limit = 20): Promise<ProjectData[]> {
    const results = await db.select().from(projects)
      .where(eq(projects.status, 'open'))
      .orderBy(desc(projects.createdAt))
      .limit(limit);
    return results;
  },

  async create(input: CreateProjectInput): Promise<ProjectData> {
    const [result] = await db.insert(projects).values({
      clientId: input.clientId,
      title: input.title,
      description: input.description,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      deadline: input.deadline,
      category: input.category,
      status: 'draft',
    }).returning();
    if (!result) throw new Error('Failed to create project');
    return result;
  },

  async update(id: string, input: UpdateProjectInput): Promise<ProjectData> {
    const [result] = await db.update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    if (!result) throw new Error('Project not found');
    return result;
  },
};

export const videoBriefRepository: VideoBriefRepository = {
  async findByProjectId(projectId: string): Promise<VideoBriefData | null> {
    const results = await db.select().from(videoBriefs)
      .where(eq(videoBriefs.projectId, projectId))
      .limit(1);
    const row = results[0];
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.projectId,
      channel: row.channel,
      duration: row.duration,
      resolution: row.resolution,
      aspectRatio: row.aspectRatio,
      fps: row.fps,
      style: row.style,
      prohibitedElements: row.prohibitedElements,
      referenceUrls: row.referenceUrls,
    };
  },

  async create(input: CreateVideoBriefInput): Promise<VideoBriefData> {
    const [result] = await db.insert(videoBriefs).values({
      projectId: input.projectId,
      channel: input.channel,
      duration: input.duration,
      resolution: input.resolution,
      aspectRatio: input.aspectRatio,
      fps: input.fps,
      style: input.style,
      prohibitedElements: input.prohibitedElements ?? null,
      referenceUrls: input.referenceUrls ?? null,
    }).returning();
    if (!result) throw new Error('Failed to create video brief');
    return {
      id: result.id,
      projectId: result.projectId,
      channel: result.channel,
      duration: result.duration,
      resolution: result.resolution,
      aspectRatio: result.aspectRatio,
      fps: result.fps,
      style: result.style,
      prohibitedElements: result.prohibitedElements,
      referenceUrls: result.referenceUrls,
    };
  },

  async update(id: string, input: Partial<CreateVideoBriefInput>): Promise<VideoBriefData> {
    const [result] = await db.update(videoBriefs)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(videoBriefs.id, id))
      .returning();
    if (!result) throw new Error('Video brief not found');
    return {
      id: result.id,
      projectId: result.projectId,
      channel: result.channel,
      duration: result.duration,
      resolution: result.resolution,
      aspectRatio: result.aspectRatio,
      fps: result.fps,
      style: result.style,
      prohibitedElements: result.prohibitedElements,
      referenceUrls: result.referenceUrls,
    };
  },
};
