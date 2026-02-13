import { eq, desc } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { orders } from '@/adapters/db/schema/orders';
import type { OrderRepository } from '@/core/ports/order-repository';
import type { OrderData, CreateOrderInput, UpdateOrderInput, OrderStatus } from '@/core/types/order';
import type { PackageTier } from '@/core/types/service';

function mapRow(row: typeof orders.$inferSelect): OrderData {
  return {
    id: row.id,
    serviceId: row.serviceId,
    buyerId: row.buyerId,
    creatorId: row.creatorId,
    packageTier: row.packageTier as PackageTier,
    price: row.price,
    commissionRate: row.commissionRate,
    commissionAmount: row.commissionAmount,
    sellerReceives: row.sellerReceives,
    status: row.status as OrderStatus,
    requirements: row.requirements,
    projectId: row.projectId,
    paymentKey: row.paymentKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const orderRepository: OrderRepository = {
  async create(input: CreateOrderInput): Promise<OrderData> {
    const rows = await db
      .insert(orders)
      .values({
        serviceId: input.serviceId,
        buyerId: input.buyerId,
        creatorId: input.creatorId,
        packageTier: input.packageTier,
        price: input.price,
        commissionRate: input.commissionRate,
        commissionAmount: input.commissionAmount,
        sellerReceives: input.sellerReceives,
        requirements: input.requirements,
      })
      .returning();
    return mapRow(rows[0]!);
  },

  async findById(id: string): Promise<OrderData | null> {
    const [row] = await db.select().from(orders).where(eq(orders.id, id));
    return row ? mapRow(row) : null;
  },

  async findByBuyerId(buyerId: string): Promise<OrderData[]> {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));
    return rows.map(mapRow);
  },

  async findByCreatorId(creatorId: string): Promise<OrderData[]> {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.creatorId, creatorId))
      .orderBy(desc(orders.createdAt));
    return rows.map(mapRow);
  },

  async findByServiceId(serviceId: string): Promise<OrderData[]> {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.serviceId, serviceId))
      .orderBy(desc(orders.createdAt));
    return rows.map(mapRow);
  },

  async update(id: string, input: UpdateOrderInput): Promise<OrderData> {
    const rows = await db
      .update(orders)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return mapRow(rows[0]!);
  },
};
