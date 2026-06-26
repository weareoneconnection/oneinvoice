import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { CreateUserSchema } from '@/lib/validation';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
