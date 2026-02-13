import type { PackageTier } from './service';

export type OrderStatus =
  | 'pending'       // 결제 대기
  | 'paid'          // 결제 완료
  | 'project_created' // 프로젝트 자동 생성됨
  | 'in_progress'   // 작업 진행 중
  | 'completed'     // 납품 완료
  | 'reviewed'      // 리뷰 완료
  | 'cancelled'     // 취소
  | 'refunded';     // 환불

export interface OrderData {
  id: string;
  serviceId: string;
  buyerId: string;
  creatorId: string;
  packageTier: PackageTier;
  price: number;
  commissionRate: number;
  commissionAmount: number;
  sellerReceives: number;
  status: OrderStatus;
  requirements: string;
  projectId: string | null;
  paymentKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  serviceId: string;
  buyerId: string;
  creatorId: string;
  packageTier: PackageTier;
  price: number;
  commissionRate: number;
  commissionAmount: number;
  sellerReceives: number;
  requirements: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  projectId?: string;
  paymentKey?: string;
}
