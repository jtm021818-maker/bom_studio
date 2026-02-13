import type { SellerLevel, SellerStats } from '@/core/types/seller-level';
import { SELLER_LEVEL_CRITERIA } from '@/core/types/seller-level';

/**
 * 셀러 통계 기반 레벨 판단
 * 높은 레벨부터 확인하여 모든 기준을 충족하는 첫 번째 레벨 반환
 *
 * - new: 가입 시 (기본)
 * - level1: 5+ 완료 주문 & 4.0+ 평점 & 80%+ 응답률
 * - level2: 20+ 완료 주문 & 4.5+ 평점 & 90%+ 응답률
 * - top: 50+ 완료 주문 & 4.8+ 평점 & 95%+ 응답률
 */
export function calculateSellerLevel(stats: SellerStats): SellerLevel {
  for (const criteria of SELLER_LEVEL_CRITERIA) {
    if (
      stats.completedOrders >= criteria.minOrders &&
      stats.avgRating >= criteria.minRating &&
      stats.responseRate >= criteria.minResponseRate
    ) {
      return criteria.level;
    }
  }

  return 'new';
}

/**
 * 셀러 레벨 한국어 라벨 반환
 */
export function getSellerLevelLabel(level: SellerLevel): string {
  const criteria = SELLER_LEVEL_CRITERIA.find((c) => c.level === level);
  return criteria?.label ?? '신규';
}
