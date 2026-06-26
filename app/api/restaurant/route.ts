import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const SetupSchema = z.object({
  name: z.string().min(2, 'Restaurant name is required'),
  tin: z.string().min(5, 'TIN is required'),
});

// POST: create restaurant and link to current user (onboarding)
export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const parsed = SetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors.map((e) => e.message).join(', ') }, { status: 400 });
    }
    const restaurant = await prisma.restaurant.create({
      data: { name: parsed.data.name, tin: parsed.data.tin }
    });
    await prisma.user.update({
      where: { id: session!.user.id },
      data: { restaurantId: restaurant.id }
    });
    return NextResponse.json(restaurant, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create restaurant.' }, { status: 500 });
  }
}

// GET: get current restaurant info
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.restaurantId) return NextResponse.json(null);
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { id: true, name: true, tin: true, myInvoisMode: true, myInvoisClientId: true }
    });
    return NextResponse.json(restaurant);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch restaurant.' }, { status: 500 });
  }
}
