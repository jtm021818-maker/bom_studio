import { pgTable, uuid, text, timestamp, pgEnum, vector } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['client', 'creator', 'admin']);
export const availabilityEnum = pgEnum('availability', ['available', 'busy', 'unavailable']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // FK to Better Auth user table
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: roleEnum('role').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const creatorProfiles = pgTable('creator_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profiles.id).notNull(),
  intro: text('intro').notNull(),
  skills: text('skills').array().notNull(),
  tools: text('tools').array().notNull(),
  availability: availabilityEnum('availability').notNull().default('available'),
  hourlyRate: text('hourly_rate'),
  portfolioUrl: text('portfolio_url'),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type NewCreatorProfile = typeof creatorProfiles.$inferInsert;
