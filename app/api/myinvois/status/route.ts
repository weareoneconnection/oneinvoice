import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRestaurant } from '@/lib/api-auth';

export async function GET() {
  const { restaurantId, error } = await requireRestaurant();
  if (error) return error;
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId! } });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    return NextResponse.json({
      mode: restaurant.myInvoisMode,
      apiConnection: restaurant.myInvoisClientId ? 'connected' : 'mocked',
      taxpayerName: restaurant.name,
      taxpayerTin: restaurant.tin,
      lastSyncAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch MyInvois status.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { restaurantId, error } = await requireRestaurant();
  if (error) return error;
  try {
    const body = await req.json();
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId! },
      data: {
        myInvoisClientId: body.clientId ?? undefined,
        myInvoisClientSecret: body.clientSecret ?? undefined,
        myInvoisMode: body.mode ?? undefined,
        tin: body.tin ?? undefined,
        name: body.name ?? undefined,
        webhookUrl: body.webhookUrl !== undefined ? (body.webhookUrl || null) : undefined,
      }
    });
    return NextResponse.json({ ok: true, mode: restaurant.myInvoisMode });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
