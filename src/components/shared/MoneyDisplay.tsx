import { formatKRW } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MoneyDisplayProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
} as const;

export function MoneyDisplay({ amount, className, size = 'md' }: MoneyDisplayProps) {
  return (
    <span className={cn('tabular-nums', sizeClasses[size], className)}>
      {formatKRW(amount)}
    </span>
  );
}

interface MoneyRangeProps {
  min: number;
  max: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MoneyRange({ min, max, className, size = 'md' }: MoneyRangeProps) {
  return (
    <span className={cn('tabular-nums', sizeClasses[size], className)}>
      {formatKRW(min)} ~ {formatKRW(max)}
    </span>
  );
}
