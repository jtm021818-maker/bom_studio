import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatKRW } from '@/lib/utils';
import type { ServiceData } from '@/core/types/service';

interface ServiceCardProps {
  service: ServiceData;
  className?: string;
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  const startingPrice = service.packages.length > 0
    ? Math.min(...service.packages.map((p) => p.price))
    : 0;

  return (
    <Link href={`/service/${service.id}`} className={cn('group block', className)}>
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
        {/* Thumbnail */}
        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-peach-100 to-serenity-100">
          {service.thumbnailUrl ? (
            <img
              src={service.thumbnailUrl}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-40">🎬</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-peach-600 transition-colors">
            {service.title}
          </h3>

          {/* Creator */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-peach-300 to-serenity-300 flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">크리에이터</span>
          </div>

          {/* Rating */}
          {service.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-xs">★</span>
              <span className="text-xs font-medium">{service.avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <p className="text-base font-bold text-gray-900">
            {formatKRW(startingPrice)}
            <span className="text-xs font-normal text-muted-foreground">~</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
