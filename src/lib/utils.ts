import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format KRW currency amount
 * @param amount - Integer amount in KRW (no decimals)
 * @returns Formatted string like "₩1,500,000"
 */
export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}
