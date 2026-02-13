import { describe, it, expect } from 'vitest';
import { calculateCommission } from '@/core/usecases/commission';
import { calculateSellerLevel, getSellerLevelLabel } from '@/core/usecases/seller-level';

describe('calculateCommission', () => {
  // ─── 15% tier (≤100,000) ───
  describe('15% tier (≤100,000원)', () => {
    it('calculates 15% for 50,000원', () => {
      const result = calculateCommission(50000);

      expect(result.servicePrice).toBe(50000);
      expect(result.commissionRate).toBe(0.15);
      expect(result.commissionAmount).toBe(7500);
      expect(result.sellerReceives).toBe(42500);
      expect(result.buyerPays).toBe(50000);
    });

    it('calculates 15% for exactly 100,000원 (boundary)', () => {
      const result = calculateCommission(100000);

      expect(result.commissionRate).toBe(0.15);
      expect(result.commissionAmount).toBe(15000);
      expect(result.sellerReceives).toBe(85000);
    });

    it('calculates 15% for 10,000원 (minimum price)', () => {
      const result = calculateCommission(10000);

      expect(result.commissionRate).toBe(0.15);
      expect(result.commissionAmount).toBe(1500);
      expect(result.sellerReceives).toBe(8500);
    });
  });

  // ─── 12% tier (≤500,000) ───
  describe('12% tier (100,001~500,000원)', () => {
    it('calculates 12% for 100,001원 (just above boundary)', () => {
      const result = calculateCommission(100001);

      expect(result.commissionRate).toBe(0.12);
      expect(result.commissionAmount).toBe(12000); // Math.round(100001 * 0.12) = 12000
      expect(result.sellerReceives).toBe(88001);
    });

    it('calculates 12% for 300,000원', () => {
      const result = calculateCommission(300000);

      expect(result.commissionRate).toBe(0.12);
      expect(result.commissionAmount).toBe(36000);
      expect(result.sellerReceives).toBe(264000);
    });

    it('calculates 12% for exactly 500,000원 (boundary)', () => {
      const result = calculateCommission(500000);

      expect(result.commissionRate).toBe(0.12);
      expect(result.commissionAmount).toBe(60000);
      expect(result.sellerReceives).toBe(440000);
    });
  });

  // ─── 10% tier (>500,000) ───
  describe('10% tier (>500,000원)', () => {
    it('calculates 10% for 500,001원 (just above boundary)', () => {
      const result = calculateCommission(500001);

      expect(result.commissionRate).toBe(0.10);
      expect(result.commissionAmount).toBe(50000); // Math.round(500001 * 0.10) = 50000
      expect(result.sellerReceives).toBe(450001);
    });

    it('calculates 10% for 1,000,000원', () => {
      const result = calculateCommission(1000000);

      expect(result.commissionRate).toBe(0.10);
      expect(result.commissionAmount).toBe(100000);
      expect(result.sellerReceives).toBe(900000);
    });
  });

  // ─── Edge cases ───
  describe('edge cases', () => {
    it('calculates for 0원', () => {
      const result = calculateCommission(0);

      expect(result.commissionAmount).toBe(0);
      expect(result.sellerReceives).toBe(0);
      expect(result.buyerPays).toBe(0);
    });

    it('throws error for negative price', () => {
      expect(() => calculateCommission(-1000)).toThrow('가격은 0 이상이어야 합니다.');
    });

    it('buyerPays always equals servicePrice (no buyer fee)', () => {
      expect(calculateCommission(50000).buyerPays).toBe(50000);
      expect(calculateCommission(300000).buyerPays).toBe(300000);
      expect(calculateCommission(1000000).buyerPays).toBe(1000000);
    });
  });
});

describe('calculateSellerLevel', () => {
  it('returns "new" for zero stats', () => {
    const level = calculateSellerLevel({ completedOrders: 0, avgRating: 0, responseRate: 0 });
    expect(level).toBe('new');
  });

  it('returns "new" for insufficient orders', () => {
    const level = calculateSellerLevel({ completedOrders: 3, avgRating: 4.5, responseRate: 90 });
    expect(level).toBe('new');
  });

  it('returns "level1" for 5+ orders, 4.0+ rating, 80%+ response', () => {
    const level = calculateSellerLevel({ completedOrders: 5, avgRating: 4.0, responseRate: 80 });
    expect(level).toBe('level1');
  });

  it('returns "level1" when rating is below level2 threshold', () => {
    const level = calculateSellerLevel({ completedOrders: 25, avgRating: 4.3, responseRate: 85 });
    expect(level).toBe('level1');
  });

  it('returns "level2" for 20+ orders, 4.5+ rating, 90%+ response', () => {
    const level = calculateSellerLevel({ completedOrders: 25, avgRating: 4.6, responseRate: 92 });
    expect(level).toBe('level2');
  });

  it('returns "level2" when orders below top threshold', () => {
    const level = calculateSellerLevel({ completedOrders: 40, avgRating: 4.9, responseRate: 98 });
    expect(level).toBe('level2');
  });

  it('returns "top" for 50+ orders, 4.8+ rating, 95%+ response', () => {
    const level = calculateSellerLevel({ completedOrders: 50, avgRating: 4.8, responseRate: 95 });
    expect(level).toBe('top');
  });

  it('returns "top" for exceeding all thresholds', () => {
    const level = calculateSellerLevel({ completedOrders: 100, avgRating: 5.0, responseRate: 100 });
    expect(level).toBe('top');
  });

  it('returns "new" when response rate is too low despite other criteria', () => {
    const level = calculateSellerLevel({ completedOrders: 50, avgRating: 4.9, responseRate: 70 });
    expect(level).toBe('new');
  });
});

describe('getSellerLevelLabel', () => {
  it('returns correct label for each level', () => {
    expect(getSellerLevelLabel('new')).toBe('신규');
    expect(getSellerLevelLabel('level1')).toBe('Level 1');
    expect(getSellerLevelLabel('level2')).toBe('Level 2');
    expect(getSellerLevelLabel('top')).toBe('Top 크리에이터');
  });
});
