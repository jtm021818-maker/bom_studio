import { pgTable, uuid, text, timestamp, integer, pgEnum, vector, jsonb, real } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const serviceStatusEnum = pgEnum('service_status', ['draft', 'active', 'paused', 'deleted']);
export const packageTierEnum = pgEnum('package_tier', ['basic', 'standard', 'premium']);

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => profiles.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  status: serviceStatusEnum('status').notNull().default('draft'),
  thumbnailUrl: text('thumbnail_url').notNull().default(''),
  galleryUrls: text('gallery_urls').array(),
  tags: text('tags').array(),
  faq: jsonb('faq').default([]),
  viewCount: integer('view_count').notNull().default(0),
  orderCount: integer('order_count').notNull().default(0),
  avgRating: real('avg_rating').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const servicePackages = pgTable('service_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  tier: packageTierEnum('tier').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  revisions: integer('revisions').notNull(),
  videoLength: text('video_length').notNull(),
  features: text('features').array(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type ServicePackageRow = typeof servicePackages.$inferSelect;
export type NewServicePackage = typeof servicePackages.$inferInsert;
