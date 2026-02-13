import { describe, it, expect, beforeEach } from 'vitest';
import { createDummyPaymentProvider } from '@/adapters/payment/dummy';
import type { PaymentProvider } from '@/core/ports/payment-provider';

describe('createDummyPaymentProvider', () => {
  let provider: PaymentProvider;

  beforeEach(() => {
    provider = createDummyPaymentProvider();
  });

  describe('createEscrow', () => {
    it('returns payment URL and key', async () => {
      const result = await provider.createEscrow({
        orderId: 'order-1',
        amount: 500000,
        orderName: 'AI 뮤직비디오 제작',
        customerName: '홍길동',
        successUrl: 'https://example.com/success',
        failUrl: 'https://example.com/fail',
      });

      expect(result.paymentUrl).toContain('order-1');
      expect(result.paymentUrl).toContain('500000');
      expect(result.paymentKey).toMatch(/^dummy_pay_/);
    });

    it('generates unique payment keys', async () => {
      const result1 = await provider.createEscrow({
        orderId: 'order-1', amount: 100000, orderName: 'Test', customerName: 'Test',
        successUrl: 'http://test', failUrl: 'http://test',
      });
      const result2 = await provider.createEscrow({
        orderId: 'order-2', amount: 200000, orderName: 'Test2', customerName: 'Test2',
        successUrl: 'http://test', failUrl: 'http://test',
      });

      expect(result1.paymentKey).not.toBe(result2.paymentKey);
    });
  });

  describe('confirmPayment', () => {
    it('returns ESCROWED status', async () => {
      const escrow = await provider.createEscrow({
        orderId: 'order-1', amount: 500000, orderName: 'Test', customerName: 'Test',
        successUrl: 'http://test', failUrl: 'http://test',
      });

      const result = await provider.confirmPayment({
        paymentKey: escrow.paymentKey,
        orderId: 'order-1',
        amount: 500000,
      });

      expect(result.status).toBe('ESCROWED');
    });
  });

  describe('releaseEscrow', () => {
    it('returns RELEASED status', async () => {
      const escrow = await provider.createEscrow({
        orderId: 'order-1', amount: 500000, orderName: 'Test', customerName: 'Test',
        successUrl: 'http://test', failUrl: 'http://test',
      });
      await provider.confirmPayment({
        paymentKey: escrow.paymentKey, orderId: 'order-1', amount: 500000,
      });

      const result = await provider.releaseEscrow(escrow.paymentKey);

      expect(result.status).toBe('RELEASED');
    });
  });

  describe('refundEscrow', () => {
    it('returns REFUNDED status', async () => {
      const escrow = await provider.createEscrow({
        orderId: 'order-1', amount: 500000, orderName: 'Test', customerName: 'Test',
        successUrl: 'http://test', failUrl: 'http://test',
      });
      await provider.confirmPayment({
        paymentKey: escrow.paymentKey, orderId: 'order-1', amount: 500000,
      });

      const result = await provider.refundEscrow(escrow.paymentKey, '고객 요청');

      expect(result.status).toBe('REFUNDED');
    });
  });

  describe('full escrow lifecycle', () => {
    it('handles create → confirm → release flow', async () => {
      const escrow = await provider.createEscrow({
        orderId: 'order-lifecycle', amount: 1000000,
        orderName: 'AI 영상 프로젝트', customerName: '이클라',
        successUrl: 'http://test/success', failUrl: 'http://test/fail',
      });
      expect(escrow.paymentKey).toBeTruthy();

      const confirmed = await provider.confirmPayment({
        paymentKey: escrow.paymentKey, orderId: 'order-lifecycle', amount: 1000000,
      });
      expect(confirmed.status).toBe('ESCROWED');

      const released = await provider.releaseEscrow(escrow.paymentKey);
      expect(released.status).toBe('RELEASED');
    });

    it('handles create → confirm → refund flow', async () => {
      const escrow = await provider.createEscrow({
        orderId: 'order-refund', amount: 300000,
        orderName: '환불 테스트', customerName: '박환불',
        successUrl: 'http://test/success', failUrl: 'http://test/fail',
      });

      await provider.confirmPayment({
        paymentKey: escrow.paymentKey, orderId: 'order-refund', amount: 300000,
      });

      const refunded = await provider.refundEscrow(escrow.paymentKey, '프로젝트 취소');
      expect(refunded.status).toBe('REFUNDED');
    });
  });
});
