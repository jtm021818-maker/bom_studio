import type { PaymentProvider } from '@/core/ports/payment-provider';

/**
 * Dummy payment provider for development.
 * Simulates Toss Payments escrow flow without real API calls.
 */
export function createDummyPaymentProvider(): PaymentProvider {
  const payments = new Map<string, { status: string; amount: number }>();

  return {
    async createEscrow(params) {
      const paymentKey = `dummy_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      payments.set(paymentKey, { status: 'READY', amount: params.amount });

      return {
        paymentUrl: `https://dummy-toss.local/checkout?orderId=${params.orderId}&amount=${params.amount}`,
        paymentKey,
      };
    },

    async confirmPayment(params) {
      const payment = payments.get(params.paymentKey);
      if (payment) {
        payment.status = 'ESCROWED';
      }
      return { status: 'ESCROWED' };
    },

    async releaseEscrow(paymentKey) {
      const payment = payments.get(paymentKey);
      if (payment) {
        payment.status = 'RELEASED';
      }
      return { status: 'RELEASED' };
    },

    async refundEscrow(paymentKey, _reason) {
      const payment = payments.get(paymentKey);
      if (payment) {
        payment.status = 'REFUNDED';
      }
      return { status: 'REFUNDED' };
    },
  };
}
