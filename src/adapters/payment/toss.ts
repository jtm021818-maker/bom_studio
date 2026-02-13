import type { PaymentProvider } from '@/core/ports/payment-provider';

/**
 * Toss Payments adapter for escrow payments.
 * Requires TOSS_PAYMENTS_SECRET_KEY environment variable.
 */
export function createTossPaymentProvider(secretKey: string): PaymentProvider {
  const baseUrl = 'https://api.tosspayments.com/v1';
  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

  async function tossRequest(path: string, body?: Record<string, unknown>) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Toss API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  return {
    async createEscrow(params) {
      const data = await tossRequest('/payments', {
        method: 'card',
        amount: params.amount,
        orderId: params.orderId,
        orderName: params.orderName,
        customerName: params.customerName,
        successUrl: params.successUrl,
        failUrl: params.failUrl,
        useEscrow: true,
      });

      return {
        paymentUrl: data['checkout'] ? (data['checkout'] as Record<string, string>)['url'] ?? '' : '',
        paymentKey: (data['paymentKey'] as string) ?? '',
      };
    },

    async confirmPayment(params) {
      const data = await tossRequest('/payments/confirm', {
        paymentKey: params.paymentKey,
        orderId: params.orderId,
        amount: params.amount,
      });

      return { status: (data['status'] as string) ?? 'UNKNOWN' };
    },

    async releaseEscrow(paymentKey) {
      const data = await tossRequest(`/payments/${paymentKey}/release-escrow`);
      return { status: (data['status'] as string) ?? 'RELEASED' };
    },

    async refundEscrow(paymentKey, reason) {
      const data = await tossRequest(`/payments/${paymentKey}/cancel`, {
        cancelReason: reason,
      });
      return { status: (data['status'] as string) ?? 'REFUNDED' };
    },
  };
}
