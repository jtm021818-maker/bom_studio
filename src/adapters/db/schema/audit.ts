import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const embeddingsAudit = pgTable('embeddings_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(), // 'creator_profile' | 'project' | 'video_brief'
  entityId: uuid('entity_id').notNull(),
  embeddingModel: text('embedding_model').notNull(),
  generatedAt: timestamp('generated_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type EmbeddingsAudit = typeof embeddingsAudit.$inferSelect;
export type NewEmbeddingsAudit = typeof embeddingsAudit.$inferInsert;
