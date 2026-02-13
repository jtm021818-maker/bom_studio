import { pgTable, uuid, text, timestamp, integer, pgEnum, real } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { services } from './services';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'project_created',
  'in_progress',
  'completed',
  'reviewed',
  'cancelled',
  'refunded',
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  buyerId: uuid('buyer_id').references(() => profiles.id).notNull(),
  creatorId: uuid('creator_id').references(() => profiles.id).notNull(),
  packageTier: text('package_tier').notNull(), // 'basic' | 'standard' | 'premium'
  price: integer('price').notNull(),
  commissionRate: real('commission_rate').notNull(),
  commissionAmount: integer('commission_amount').notNull(),
  sellerReceives: integer('seller_receives').notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  requirements: text('requirements').notNull().default(''),
  projectId: uuid('project_id'),
  paymentKey: text('payment_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
