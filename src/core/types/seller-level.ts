export type SellerLevel = 'new' | 'level1' | 'level2' | 'top';

export interface SellerLevelCriteria {
  level: SellerLevel;
  label: string;
  minOrders: number;
  minRating: number;
  minResponseRate: number;
}

export interface SellerStats {
  completedOrders: number;
  avgRating: number;
  responseRate: number;
}

export const SELLER_LEVEL_CRITERIA: SellerLevelCriteria[] = [
  { level: 'top', label: 'Top 크리에이터', minOrders: 50, minRating: 4.8, minResponseRate: 95 },
  { level: 'level2', label: 'Level 2', minOrders: 20, minRating: 4.5, minResponseRate: 90 },
  { level: 'level1', label: 'Level 1', minOrders: 5, minRating: 4.0, minResponseRate: 80 },
  { level: 'new', label: '신규', minOrders: 0, minRating: 0, minResponseRate: 0 },
];
