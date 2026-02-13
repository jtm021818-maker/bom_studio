import type { PaymentProvider } from '@/core/ports/payment-provider';
import { createTossPaymentProvider } from './toss';
import { createDummyPaymentProvider } from './dummy';

let _cachedProvider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_cachedProvider) return _cachedProvider;

  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;

  if (secretKey) {
    _cachedProvider = createTossPaymentProvider(secretKey);
  } else {
    console.warn('[Payment] TOSS_PAYMENTS_SECRET_KEY not set — using dummy payment provider');
    _cachedProvider = createDummyPaymentProvider();
  }

  return _cachedProvider;
}
