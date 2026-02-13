import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getPaymentProvider } from '@/adapters/payment';

/** POST /api/payments - Create escrow payment */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    orderId: string;
    amount: number;
    orderName: string;
    customerName: string;
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const provider = getPaymentProvider();

  try {
    const result = await provider.createEscrow({
      ...body,
      successUrl: `${appUrl}/api/payments/callback?status=success`,
      failUrl: `${appUrl}/api/payments/callback?status=fail`,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment failed' }, { status: 500 });
  }
}

/** PATCH /api/payments?paymentKey=xxx&action=confirm|release|refund */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const paymentKey = request.nextUrl.searchParams.get('paymentKey');
  const action = request.nextUrl.searchParams.get('action');
  if (!paymentKey || !action) return NextResponse.json({ error: 'paymentKey and action required' }, { status: 400 });

  const provider = getPaymentProvider();

  try {
    if (action === 'confirm') {
      const body = await request.json() as { orderId: string; amount: number };
      const result = await provider.confirmPayment({ paymentKey, orderId: body.orderId, amount: body.amount });
      return NextResponse.json(result);
    }

    if (action === 'release') {
      const result = await provider.releaseEscrow(paymentKey);
      return NextResponse.json(result);
    }

    if (action === 'refund') {
      const body = await request.json() as { reason: string };
      const result = await provider.refundEscrow(paymentKey, body.reason);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
