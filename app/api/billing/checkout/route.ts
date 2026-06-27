import { NextResponse } from 'next/server';
import { stripe, PLANS, getPlan } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireRestaurant } from '@/lib/api-auth';

export async function POST(req: Request) {
  const { restaurantId, session, error } = await requireRestaurant();
  if (error) return error;

  const { plan } = await req.json();
  const planKey = getPlan(plan);
  if (planKey === 'free') return NextResponse.json({ error: 'Cannot checkout free plan.' }, { status: 400 });

  const planMeta = PLANS[planKey];
  if (!planMeta.stripePriceId) {
    return NextResponse.json({ error: 'Stripe price not configured. Set STRIPE_PRICE_STARTER and STRIPE_PRICE_PRO env vars.' }, { status: 500 });
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId! } });
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  // Reuse existing Stripe customer or create new
  let customerId = restaurant.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session!.user.email ?? undefined,
      name: restaurant.name,
      metadata: { restaurantId: restaurant.id },
    });
    customerId = customer.id;
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { stripeCustomerId: customerId }
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planMeta.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/settings/billing?success=1`,
    cancel_url: `${baseUrl}/settings/billing?canceled=1`,
    subscription_data: {
      metadata: { restaurantId: restaurant.id, plan: planKey },
      trial_period_days: 14,
    },
    metadata: { restaurantId: restaurant.id, plan: planKey },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
