import type { OrderData, CreateOrderInput, UpdateOrderInput } from '@/core/types/order';

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<OrderData>;
  findById(id: string): Promise<OrderData | null>;
  findByBuyerId(buyerId: string): Promise<OrderData[]>;
  findByCreatorId(creatorId: string): Promise<OrderData[]>;
  findByServiceId(serviceId: string): Promise<OrderData[]>;
  update(id: string, input: UpdateOrderInput): Promise<OrderData>;
}
