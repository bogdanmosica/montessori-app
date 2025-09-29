import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
// import { getPaymentDetails, updatePaymentStatus } from '@/lib/services/payment-service';
import { stripe } from '@/lib/payments/stripe';
import { z } from 'zod';

const RefundRequestSchema = z.object({
  school_id: z.string().transform(val => parseInt(val)),
  amount: z.number().positive(),
  reason: z.string().min(1, 'Reason is required')
});

interface RouteParams {
  params: Promise<{
    payment_id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      requireAdminPermissions(session.user.role);
    } catch {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { payment_id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = RefundRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { school_id: schoolId, amount, reason } = validation.data;

    // Get payment details
    const payment = await getPaymentDetails(payment_id, schoolId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed payments can be refunded' },
        { status: 400 }
      );
    }

    if (!payment.stripePaymentId) {
      return NextResponse.json(
        { error: 'Cannot refund non-Stripe payments' },
        { status: 400 }
      );
    }

    // Convert amount to cents for Stripe (assuming amount is in dollars)
    const amountInCents = Math.round(amount * 100);
    const originalAmountInCents = Math.round(parseFloat(payment.amount) * 100);

    if (amountInCents > originalAmountInCents) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original payment amount' },
        { status: 400 }
      );
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: amountInCents,
      reason: 'requested_by_customer',
      metadata: {
        admin_id: session.user.id.toString(),
        school_id: schoolId.toString(),
        refund_reason: reason
      }
    });

    // Update payment status
    if (amountInCents === originalAmountInCents) {
      // Full refund
      await updatePaymentStatus(payment_id, schoolId, 'refunded', new Date());
    }

    const response = {
      refund_id: refund.id,
      status: refund.status,
      amount: refund.amount / 100, // Convert back to dollars
      processing_date: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Refund processing error:', error);

    if (error instanceof Error) {
      // Handle Stripe specific errors
      if (error.message.includes('payment_intent')) {
        return NextResponse.json(
          { error: 'Invalid payment for refund processing' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}