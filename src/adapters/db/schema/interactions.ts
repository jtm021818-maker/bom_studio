import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { projects } from './projects';

export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'accepted', 'rejected']);

export const milestoneStatusEnum = pgEnum('milestone_status', [
  'pending',
  'submitted',
  'approved',
  'revision_requested',
  'completed',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'escrowed',
  'released',
  'refunded',
]);

export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  creatorId: uuid('creator_id').references(() => profiles.id).notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  milestones: text('milestones').notNull(),
  revisionScope: text('revision_scope').notNull(),
  price: integer('price').notNull(),
  status: proposalStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  proposalId: uuid('proposal_id').references(() => proposals.id).notNull(),
  clientId: uuid('client_id').references(() => profiles.id).notNull(),
  creatorId: uuid('creator_id').references(() => profiles.id).notNull(),
  terms: text('terms').notNull(),
  signedAt: timestamp('signed_at'),
  modusignDocumentId: text('modusign_document_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: milestoneStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  milestoneId: uuid('milestone_id').references(() => milestones.id).notNull(),
  fileUrl: text('file_url').notNull(),
  hasWatermark: boolean('has_watermark').notNull().default(true),
  submittedAt: timestamp('submitted_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  milestoneId: uuid('milestone_id').references(() => milestones.id).notNull(),
  amount: integer('amount').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  tossPaymentKey: text('toss_payment_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
