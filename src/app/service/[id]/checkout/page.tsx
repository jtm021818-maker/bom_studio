'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shared/AppShell';
import { JellyButton } from '@/components/shared/JellyButton';
import { formatKRW } from '@/lib/utils';
import { calculateCommission } from '@/core/usecases/commission';
import type { ServiceData, PackageTier } from '@/core/types/service';

const TIER_LABELS: Record<PackageTier, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = params.id as string;
  const selectedTier = (searchParams.get('tier') ?? 'basic') as PackageTier;

  const [service, setService] = useState<ServiceData | null>(null);
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${serviceId}`);
        if (res.ok) {
          const data = await res.json() as ServiceData;
          setService(data);
        }
      } catch {
        setError('서비스를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const selectedPackage = service?.packages.find((p) => p.tier === selectedTier);
  const commission = selectedPackage ? calculateCommission(selectedPackage.price) : null;

  const handleSubmit = async () => {
    if (!selectedPackage || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          packageTier: selectedTier,
          requirements,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error: string };
        throw new Error(data.error || '주문 생성에 실패했습니다.');
      }

      const order = await res.json() as { id: string };
      router.push(`/service/${serviceId}/checkout/complete?orderId=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!service || !selectedPackage || !commission) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold mb-2">서비스를 찾을 수 없습니다</h1>
          <Link href="/" className="text-peach-500 hover:underline text-sm">홈으로 돌아가기</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-gray-900">홈</Link>
          <span className="mx-1">/</span>
          <Link href={`/service/${serviceId}`} className="hover:text-gray-900">{service.title}</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-900">결제</span>
        </nav>

        <h1 className="text-2xl font-bold mb-8">주문 확인</h1>

        {/* Service Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">서비스</h2>
          <div className="flex gap-4">
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-peach-100 to-serenity-100 flex-shrink-0">
              {service.thumbnailUrl ? (
                <img src={service.thumbnailUrl} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-40">🎬</div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm">{service.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {TIER_LABELS[selectedTier]} 패키지
              </p>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {TIER_LABELS[selectedTier]} 패키지 상세
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">영상 길이</span>
              <span className="font-medium">{selectedPackage.videoLength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">납기</span>
              <span className="font-medium">{selectedPackage.deliveryDays}일</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">수정 횟수</span>
              <span className="font-medium">{selectedPackage.revisions}회</span>
            </div>
            {selectedPackage.features.length > 0 && (
              <div className="pt-2 border-t border-gray-50">
                <p className="text-gray-600 mb-1">포함 사항</p>
                <ul className="space-y-1">
                  {selectedPackage.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
                      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">결제 금액</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">서비스 가격</span>
              <span className="font-medium">{formatKRW(commission.servicePrice)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>플랫폼 수수료 ({(commission.commissionRate * 100).toFixed(0)}%)</span>
              <span>-{formatKRW(commission.commissionAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>크리에이터 정산액</span>
              <span>{formatKRW(commission.sellerReceives)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-semibold">총 결제 금액</span>
              <span className="text-lg font-bold text-peach-600">{formatKRW(commission.buyerPays)}</span>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">추가 요구사항 (선택)</h2>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="크리에이터에게 전달할 구체적인 요구사항을 작성해주세요. (참고 영상, 컨셉, 분위기 등)"
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-peach-300 focus:border-transparent"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Link href={`/service/${serviceId}`} className="text-sm text-muted-foreground hover:text-gray-900">
            ← 서비스로 돌아가기
          </Link>
          <JellyButton
            gradient="mixed"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10"
          >
            {submitting ? '처리 중...' : `${formatKRW(commission.buyerPays)} 결제하기`}
          </JellyButton>
        </div>
      </div>
    </AppShell>
  );
}
