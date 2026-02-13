import { pgTable, uuid, text, timestamp, integer, pgEnum, vector } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'open',
  'in_progress',
  'review',
  'completed',
  'cancelled',
]);

export const channelEnum = pgEnum('channel', [
  'youtube_short',
  'youtube_long',
  'instagram_reel',
  'tiktok',
  'other',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'approved',
  'revision_requested',
]);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => profiles.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: projectStatusEnum('status').notNull().default('draft'),
  budgetMin: integer('budget_min').notNull(),
  budgetMax: integer('budget_max').notNull(),
  deadline: timestamp('deadline').notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const videoBriefs = pgTable('video_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  channel: channelEnum('channel').notNull(),
  duration: text('duration').notNull(),
  resolution: text('resolution').notNull(),
  aspectRatio: text('aspect_ratio').notNull(),
  fps: text('fps').notNull(),
  style: text('style').notNull(),
  prohibitedElements: text('prohibited_elements').array(),
  referenceUrls: text('reference_urls').array(),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const storyboardItems = pgTable('storyboard_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  sceneNumber: integer('scene_number').notNull(),
  description: text('description').notNull(),
  goal: text('goal').notNull(),
  reference: text('reference'),
  reviewStatus: reviewStatusEnum('review_status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const shotlistItems = pgTable('shotlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  shotNumber: integer('shot_number').notNull(),
  camera: text('camera').notNull(),
  motion: text('motion').notNull(),
  effects: text('effects'),
  duration: text('duration').notNull(),
  reference: text('reference'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type VideoBrief = typeof videoBriefs.$inferSelect;
export type NewVideoBrief = typeof videoBriefs.$inferInsert;
export type StoryboardItem = typeof storyboardItems.$inferSelect;
export type NewStoryboardItem = typeof storyboardItems.$inferInsert;
export type ShotlistItem = typeof shotlistItems.$inferSelect;
export type NewShotlistItem = typeof shotlistItems.$inferInsert;
