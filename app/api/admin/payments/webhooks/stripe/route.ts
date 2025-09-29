import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
// import { updatePaymentStatus } from '@/lib/services/payment-service';
import { createFailedPaymentAlert, createWebhookFailureAlert } from '@/lib/services/alert-service';
import { db } from '@/lib/db';
import { paymentRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Create a webhook failure alert
    try {
      // Try to extract school ID from payment intent metadata if available
      let schoolId = 1; // Default fallback
      if (event.data.object && 'metadata' in event.data.object && event.data.object.metadata?.school_id) {
        schoolId = parseInt(event.data.object.metadata.school_id);
      }

      await createWebhookFailureAlert(
        schoolId,
        event.type,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } catch (alertError) {
      console.error('Failed to create webhook failure alert:', alertError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const stripePaymentId = paymentIntent.id;

  // Find the payment record
  const payment = await db
    .select()
    .from(paymentRecords)
    .where(eq(paymentRecords.stripePaymentId, stripePaymentId))
    .limit(1);

  if (payment.length === 0) {
    console.error('Payment record not found for successful payment:', stripePaymentId);
    return;
  }

  const paymentRecord = payment[0];

  // Update payment status to completed
  await updatePaymentStatus(
    paymentRecord.id,
    paymentRecord.schoolId,
    'completed',
    new Date()
  );

  console.log('Payment marked as completed:', paymentRecord.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const stripePaymentId = paymentIntent.id;
  const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

  // Find the payment record
  const payment = await db
    .select()
    .from(paymentRecords)
    .where(eq(paymentRecords.stripePaymentId, stripePaymentId))
    .limit(1);

  if (payment.length === 0) {
    console.error('Payment record not found for failed payment:', stripePaymentId);
    return;
  }

  const paymentRecord = payment[0];

  // Update payment status to failed
  await updatePaymentStatus(
    paymentRecord.id,
    paymentRecord.schoolId,
    'failed',
    undefined,
    failureReason
  );

  // Create an alert for the failed payment
  await createFailedPaymentAlert(
    paymentRecord.schoolId,
    paymentRecord.parentId,
    paymentRecord.id,
    failureReason
  );

  console.log('Payment marked as failed and alert created:', paymentRecord.id);
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const stripePaymentId = paymentIntent.id;

  // Find the payment record
  const payment = await db
    .select()
    .from(paymentRecords)
    .where(eq(paymentRecords.stripePaymentId, stripePaymentId))
    .limit(1);

  if (payment.length === 0) {
    console.error('Payment record not found for canceled payment:', stripePaymentId);
    return;
  }

  const paymentRecord = payment[0];

  // Update payment status to canceled
  await updatePaymentStatus(
    paymentRecord.id,
    paymentRecord.schoolId,
    'cancelled'
  );

  console.log('Payment marked as canceled:', paymentRecord.id);
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  const chargeId = dispute.charge as string;

  // Find the payment record associated with this charge
  // Note: This requires additional logic to link charges to payment intents
  // For now, just log the dispute
  console.log('Charge dispute created:', {
    disputeId: dispute.id,
    chargeId,
    amount: dispute.amount,
    reason: dispute.reason
  });

  // TODO: Implement dispute handling logic
  // 1. Find the associated payment record
  // 2. Create a high-priority alert
  // 3. Notify admins about the dispute
}