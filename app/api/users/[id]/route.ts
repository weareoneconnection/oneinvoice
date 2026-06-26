import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;
  if (session!.user.id === params.id) {
    return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 });
  }
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
