import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  restaurantName: z.string().min(2, 'Restaurant name is required'),
  tin: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { email, password, name, restaurantName, tin } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });

    const restaurant = await prisma.restaurant.create({
      data: { name: restaurantName, tin: tin ?? '' }
    });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, name, restaurantId: restaurant.id }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
