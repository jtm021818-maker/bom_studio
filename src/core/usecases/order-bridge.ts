import type { OrderRepository } from '@/core/ports/order-repository';
import type { ProjectRepository } from '@/core/ports/project-repository';
import type { ProposalRepository } from '@/core/ports/proposal-repository';
import type { MilestoneRepository } from '@/core/ports/milestone-repository';
import type { ServiceRepository } from '@/core/ports/service-repository';
import type { OrderData } from '@/core/types/order';

/**
 * Order Bridge: 서비스 구매 완료 → 프로젝트/제안서/마일스톤 자동 생성
 *
 * Flow:
 * 1. Order status → 'paid'
 * 2. Project 자동 생성 (title: 서비스명, clientId: 구매자, status: 'in_progress')
 * 3. Proposal 자동 생성 (creatorId: 서비스 소유자, status: 'accepted')
 * 4. Milestones 기본 2개 생성 (1차 시안, 최종 납품)
 * 5. Order status → 'project_created'
 */
export function createOrderBridge(deps: {
  orderRepo: OrderRepository;
  projectRepo: ProjectRepository;
  proposalRepo: ProposalRepository;
  milestoneRepo: MilestoneRepository;
  serviceRepo: ServiceRepository;
}) {
  const { orderRepo, projectRepo, proposalRepo, milestoneRepo, serviceRepo } = deps;

  return {
    /**
     * Process a paid order: create project, proposal, and milestones.
     * Returns the updated order with projectId set.
     */
    async processOrder(orderId: string): Promise<OrderData> {
      const order = await orderRepo.findById(orderId);
      if (!order) throw new Error('주문을 찾을 수 없습니다.');
      if (order.status !== 'paid') throw new Error('결제 완료된 주문만 처리할 수 있습니다.');

      const service = await serviceRepo.findById(order.serviceId);
      if (!service) throw new Error('서비스를 찾을 수 없습니다.');

      const pkg = service.packages.find((p) => p.tier === order.packageTier);
      if (!pkg) throw new Error('패키지를 찾을 수 없습니다.');

      // 1. Create project
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + pkg.deliveryDays);

      const project = await projectRepo.create({
        clientId: order.buyerId,
        title: `[서비스 주문] ${service.title}`,
        description: `서비스: ${service.title}\n패키지: ${pkg.title} (${pkg.tier})\n\n${order.requirements || '추가 요구사항 없음'}`,
        budgetMin: order.price,
        budgetMax: order.price,
        deadline: deadlineDate,
        category: service.category,
      });

      // Set project status to in_progress
      await projectRepo.update(project.id, { status: 'in_progress' });

      // 2. Create accepted proposal
      await proposalRepo.create({
        projectId: project.id,
        creatorId: order.creatorId,
        deliveryDays: pkg.deliveryDays,
        milestones: `1차 시안 → 최종 납품 (${pkg.revisions}회 수정 포함)`,
        revisionScope: `최대 ${pkg.revisions}회 수정`,
        price: order.price,
      });

      // 3. Create 2 milestones: 1차 시안 + 최종 납품
      const firstDueDate = new Date();
      firstDueDate.setDate(firstDueDate.getDate() + Math.ceil(pkg.deliveryDays * 0.6));

      const halfPrice = Math.floor(order.sellerReceives / 2);
      const remainderPrice = order.sellerReceives - halfPrice;

      await milestoneRepo.create({
        projectId: project.id,
        title: '1차 시안',
        description: `${service.title} 1차 시안 납품 (영상 길이: ${pkg.videoLength})`,
        amount: halfPrice,
        dueDate: firstDueDate,
      });

      await milestoneRepo.create({
        projectId: project.id,
        title: '최종 납품',
        description: `${service.title} 최종 납품 (수정 ${pkg.revisions}회 포함)`,
        amount: remainderPrice,
        dueDate: deadlineDate,
      });

      // 4. Update order status
      const updatedOrder = await orderRepo.update(orderId, {
        status: 'project_created',
        projectId: project.id,
      });

      return updatedOrder;
    },
  };
}
