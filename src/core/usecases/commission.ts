export interface CommissionResult {
  servicePrice: number;
  commissionRate: number;
  commissionAmount: number;
  sellerReceives: number;
  buyerPays: number;
}

/**
 * 거래액 기준 차등 수수료 계산
 * - ≤100,000원: 15%
 * - ≤500,000원: 12%
 * - >500,000원: 10%
 *
 * 바이어 추가 수수료 없음 (buyerPays = servicePrice)
 */
export function calculateCommission(price: number): CommissionResult {
  if (price < 0) throw new Error('가격은 0 이상이어야 합니다.');

  let commissionRate: number;

  if (price <= 100000) {
    commissionRate = 0.15;
  } else if (price <= 500000) {
    commissionRate = 0.12;
  } else {
    commissionRate = 0.10;
  }

  const commissionAmount = Math.round(price * commissionRate);
  const sellerReceives = price - commissionAmount;

  return {
    servicePrice: price,
    commissionRate,
    commissionAmount,
    sellerReceives,
    buyerPays: price,
  };
}
