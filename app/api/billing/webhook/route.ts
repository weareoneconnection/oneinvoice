import { NextResponse } from 'next/server';
import { stripe, getPlan } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

async function syncSubscription(sub: Stripe.Subscription) {
  const restaurantId = sub.metadata?.restaurantId;
  if (!restaurantId) return;

  const plan = getPlan(sub.metadata?.plan ?? 'free');
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      plan,
      stripeSubscriptionId: sub.id,
      stripePriceId: (sub.items.data[0]?.price?.id) ?? null,
      subscriptionStatus: sub.status,
      currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
      trialEndsAt: (sub as unknown as { trial_end: number | null }).trial_end
        ? new Date((sub as unknown as { trial_end: number }).trial_end * 1000)
        : null,
    }
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        // Merge checkout metadata into subscription
        if (session.metadata?.restaurantId && !sub.metadata?.restaurantId) {
          await stripe.subscriptions.update(sub.id, {
            metadata: { restaurantId: session.metadata.restaurantId, plan: session.metadata.plan ?? 'starter' }
          });
          sub.metadata = { ...sub.metadata, restaurantId: session.metadata.restaurantId, plan: session.metadata.plan ?? 'starter' };
        }
        await syncSubscription(sub);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      if (event.type === 'customer.subscription.deleted') {
        await prisma.restaurant.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: 'free', subscriptionStatus: 'canceled', stripeSubscriptionId: null }
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
