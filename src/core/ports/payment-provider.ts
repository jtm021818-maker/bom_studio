/**
 * Port for payment operations (Toss Payments escrow).
 */
export interface PaymentProvider {
  /** Create an escrow payment and return confirmation URL */
  createEscrow(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerName: string;
    successUrl: string;
    failUrl: string;
  }): Promise<{ paymentUrl: string; paymentKey: string }>;

  /** Confirm/approve an escrow payment */
  confirmPayment(params: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<{ status: string }>;

  /** Release escrow funds to the seller */
  releaseEscrow(paymentKey: string): Promise<{ status: string }>;

  /** Refund an escrow payment */
  refundEscrow(paymentKey: string, reason: string): Promise<{ status: string }>;
}
