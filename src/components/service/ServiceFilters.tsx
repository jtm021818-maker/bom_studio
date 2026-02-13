'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SERVICE_CATEGORIES } from '@/core/validators/service';

// ─── Filter option constants ───

const DELIVERY_OPTIONS = [
  { value: '', label: '상관없음' },
  { value: '1', label: '24시간' },
  { value: '3', label: '3일 이내' },
  { value: '7', label: '7일 이내' },
  { value: '14', label: '14일 이내' },
] as const;

const SELLER_LEVEL_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'level1', label: 'Level 1+' },
  { value: 'level2', label: 'Level 2+' },
  { value: 'top', label: 'Top' },
] as const;

const RATING_OPTIONS = [
  { value: '', label: '전체' },
  { value: '4.0', label: '4.0 이상' },
  { value: '4.5', label: '4.5 이상' },
  { value: '4.8', label: '4.8 이상' },
] as const;

const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'newest', label: '최신순' },
  { value: 'rating', label: '평점순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
] as const;

// ─── Types ───

interface ActiveFilter {
  key: string;
  label: string;
  paramKey: string;
}

// ─── Component ───

export function ServiceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current param values
  const currentCategory = searchParams.get('category') ?? '';
  const currentSort = searchParams.get('sort') ?? 'popular';
  const currentMinPrice = searchParams.get('minPrice') ?? '';
  const currentMaxPrice = searchParams.get('maxPrice') ?? '';
  const currentDelivery = searchParams.get('delivery') ?? '';
  const currentLevel = searchParams.get('level') ?? '';
  const currentRating = searchParams.get('rating') ?? '';

  // Build URL with updated params
  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset page when filters change
      if (!('page' in updates)) {
        params.delete('page');
      }
      return `/services?${params.toString()}`;
    },
    [searchParams],
  );

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      router.push(buildUrl(updates));
    },
    [router, buildUrl],
  );

  // Active filters for pill display
  const activeFilters = useMemo(() => {
    const filters: ActiveFilter[] = [];

    if (currentCategory) {
      const cat = SERVICE_CATEGORIES.find((c) => c.value === currentCategory);
      if (cat) filters.push({ key: `cat-${currentCategory}`, label: cat.label, paramKey: 'category' });
    }
    if (currentMinPrice) {
      filters.push({ key: 'minPrice', label: `최소 ₩${Number(currentMinPrice).toLocaleString()}`, paramKey: 'minPrice' });
    }
    if (currentMaxPrice) {
      filters.push({ key: 'maxPrice', label: `최대 ₩${Number(currentMaxPrice).toLocaleString()}`, paramKey: 'maxPrice' });
    }
    if (currentDelivery) {
      const opt = DELIVERY_OPTIONS.find((d) => d.value === currentDelivery);
      if (opt) filters.push({ key: 'delivery', label: `납기 ${opt.label}`, paramKey: 'delivery' });
    }
    if (currentLevel) {
      const opt = SELLER_LEVEL_OPTIONS.find((l) => l.value === currentLevel);
      if (opt) filters.push({ key: 'level', label: `셀러 ${opt.label}`, paramKey: 'level' });
    }
    if (currentRating) {
      filters.push({ key: 'rating', label: `★ ${currentRating}+`, paramKey: 'rating' });
    }

    return filters;
  }, [currentCategory, currentMinPrice, currentMaxPrice, currentDelivery, currentLevel, currentRating]);

  const clearAllFilters = useCallback(() => {
    router.push('/services');
  }, [router]);

  const removeFilter = useCallback(
    (paramKey: string) => {
      navigate({ [paramKey]: '' });
    },
    [navigate],
  );

  return (
    <div className="space-y-6">
      {/* Sort Pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => navigate({ sort: opt.value })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              currentSort === opt.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Category Select */}
        <select
          value={currentCategory}
          onChange={(e) => navigate({ category: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
        >
          <option value="">모든 카테고리</option>
          {SERVICE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>

        {/* Price Range */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="최소 가격"
            value={currentMinPrice}
            onChange={(e) => navigate({ minPrice: e.target.value })}
            className="w-28 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
            min={0}
            step={10000}
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="number"
            placeholder="최대 가격"
            value={currentMaxPrice}
            onChange={(e) => navigate({ maxPrice: e.target.value })}
            className="w-28 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
            min={0}
            step={10000}
          />
        </div>

        {/* Delivery Filter */}
        <select
          value={currentDelivery}
          onChange={(e) => navigate({ delivery: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
        >
          {DELIVERY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              납기: {opt.label}
            </option>
          ))}
        </select>

        {/* Seller Level Filter */}
        <select
          value={currentLevel}
          onChange={(e) => navigate({ level: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
        >
          {SELLER_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              셀러: {opt.label}
            </option>
          ))}
        </select>

        {/* Rating Filter */}
        <select
          value={currentRating}
          onChange={(e) => navigate({ rating: e.target.value })}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              평점: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filter Pills */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">적용된 필터:</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => removeFilter(filter.paramKey)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-peach-50 text-peach-700 text-xs font-medium hover:bg-peach-100 transition-colors"
            >
              {filter.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-gray-900 underline"
          >
            전체 해제
          </button>
        </div>
      )}
    </div>
  );
}
