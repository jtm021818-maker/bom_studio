import { describe, it, expect } from 'vitest';
import { formatKRW } from '@/lib/utils';

describe('formatKRW', () => {
  it('formats 1500000 as ₩1,500,000', () => {
    expect(formatKRW(1500000)).toBe('₩1,500,000');
  });

  it('formats 0 as ₩0', () => {
    expect(formatKRW(0)).toBe('₩0');
  });

  it('formats 500 as ₩500', () => {
    expect(formatKRW(500)).toBe('₩500');
  });

  it('formats large amounts correctly', () => {
    expect(formatKRW(10000000)).toBe('₩10,000,000');
  });

  it('formats negative amounts', () => {
    expect(formatKRW(-500000)).toBe('₩-500,000');
  });
});
