import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireRestaurant } from '@/lib/api-auth';

export async function POST() {
  const { restaurantId, error } = await requireRestaurant();
  if (error) return error;

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId! } });
  if (!restaurant?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found. Subscribe first.' }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const session = await stripe.billingPortal.sessions.create({
    customer: restaurant.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
