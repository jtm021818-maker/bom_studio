'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard, GlassCardContent } from '@/components/shared/GlassCard';
import { JellyButton } from '@/components/shared/JellyButton';
import { formatKRW } from '@/lib/utils';
import type { ServicePackage, PackageTier } from '@/core/types/service';

interface ServiceDetailClientProps {
  packages: ServicePackage[];
  serviceId: string;
}

export function ServiceDetailClient({ packages, serviceId }: ServiceDetailClientProps) {
  const tiers: PackageTier[] = ['basic', 'standard', 'premium'];
  const availableTiers = tiers.filter((t) => packages.some((p) => p.tier === t));
  const [selectedTier, setSelectedTier] = useState<PackageTier>(availableTiers[0] ?? 'basic');

  const selectedPackage = packages.find((p) => p.tier === selectedTier);

  return (
    <GlassCard className="sticky top-20">
      <GlassCardContent className="py-6 space-y-4">
        {/* Tier Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          {availableTiers.map((tier) => {
            const pkg = packages.find((p) => p.tier === tier);
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  selectedTier === tier
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {pkg?.title ?? tier}
              </button>
            );
          })}
        </div>

        {/* Selected Package Detail */}
        {selectedPackage && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {formatKRW(selectedPackage.price)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">{selectedPackage.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📅</span>
                  <span>{selectedPackage.deliveryDays}일 납기</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">🔄</span>
                  <span>수정 {selectedPackage.revisions}회</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">🎬</span>
                  <span>{selectedPackage.videoLength}</span>
                </div>
              </div>

              {selectedPackage.features.length > 0 && (
                <div className="pt-2 space-y-1">
                  {selectedPackage.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-500">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href={`/service/${serviceId}/checkout?tier=${selectedTier}`} className="block">
              <JellyButton gradient="mixed" className="w-full" size="lg">
                구매하기
              </JellyButton>
            </Link>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
