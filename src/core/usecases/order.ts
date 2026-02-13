import type { OrderRepository } from '@/core/ports/order-repository';
import type { ServiceRepository } from '@/core/ports/service-repository';
import type { OrderData, CreateOrderInput } from '@/core/types/order';
import type { PackageTier } from '@/core/types/service';
import { calculateCommission } from './commission';

export function createOrderUseCases(
  orderRepo: OrderRepository,
  serviceRepo: ServiceRepository,
) {
  return {
    async getOrder(id: string): Promise<OrderData | null> {
      return orderRepo.findById(id);
    },

    async listBuyerOrders(buyerId: string): Promise<OrderData[]> {
      return orderRepo.findByBuyerId(buyerId);
    },

    async listCreatorOrders(creatorId: string): Promise<OrderData[]> {
      return orderRepo.findByCreatorId(creatorId);
    },

    /**
     * Create an order for a service package.
     * Validates the service exists & is active, finds the selected package,
     * and calculates commission.
     */
    async createOrder(params: {
      serviceId: string;
      buyerId: string;
      packageTier: PackageTier;
      requirements: string;
    }): Promise<OrderData> {
      const service = await serviceRepo.findById(params.serviceId);
      if (!service) throw new Error('서비스를 찾을 수 없습니다.');
      if (service.status !== 'active') throw new Error('현재 구매할 수 없는 서비스입니다.');

      const pkg = service.packages.find((p) => p.tier === params.packageTier);
      if (!pkg) throw new Error('선택한 패키지를 찾을 수 없습니다.');

      if (params.buyerId === service.creatorId) {
        throw new Error('자신의 서비스는 구매할 수 없습니다.');
      }

      const commission = calculateCommission(pkg.price);

      const input: CreateOrderInput = {
        serviceId: params.serviceId,
        buyerId: params.buyerId,
        creatorId: service.creatorId,
        packageTier: params.packageTier,
        price: pkg.price,
        commissionRate: commission.commissionRate,
        commissionAmount: commission.commissionAmount,
        sellerReceives: commission.sellerReceives,
        requirements: params.requirements,
      };

      const order = await orderRepo.create(input);

      // Increment service order count
      await serviceRepo.updateStats(params.serviceId, 'orderCount', 1);

      return order;
    },

    async markPaid(orderId: string, paymentKey: string): Promise<OrderData> {
      return orderRepo.update(orderId, { status: 'paid', paymentKey });
    },

    async markProjectCreated(orderId: string, projectId: string): Promise<OrderData> {
      return orderRepo.update(orderId, { status: 'project_created', projectId });
    },

    async markInProgress(orderId: string): Promise<OrderData> {
      return orderRepo.update(orderId, { status: 'in_progress' });
    },

    async markCompleted(orderId: string): Promise<OrderData> {
      return orderRepo.update(orderId, { status: 'completed' });
    },

    async markReviewed(orderId: string): Promise<OrderData> {
      return orderRepo.update(orderId, { status: 'reviewed' });
    },

    async cancelOrder(orderId: string): Promise<OrderData> {
      const order = await orderRepo.findById(orderId);
      if (!order) throw new Error('주문을 찾을 수 없습니다.');
      if (order.status !== 'pending') throw new Error('대기 중인 주문만 취소할 수 있습니다.');
      return orderRepo.update(orderId, { status: 'cancelled' });
    },
  };
}
