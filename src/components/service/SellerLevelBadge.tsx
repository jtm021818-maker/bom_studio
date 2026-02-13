import { cn } from '@/lib/utils';
import type { SellerLevel } from '@/core/types/seller-level';
import { getSellerLevelLabel } from '@/core/usecases/seller-level';

interface SellerLevelBadgeProps {
  level: SellerLevel;
  className?: string;
}

const levelStyles: Record<SellerLevel, string> = {
  new: 'bg-gray-100 text-gray-600',
  level1: 'bg-blue-50 text-blue-600',
  level2: 'bg-emerald-50 text-emerald-600',
  top: 'bg-amber-50 text-amber-600',
};

export function SellerLevelBadge({ level, className }: SellerLevelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none',
        levelStyles[level],
        className,
      )}
    >
      {level === 'top' && '👑 '}
      {getSellerLevelLabel(level)}
    </span>
  );
}
