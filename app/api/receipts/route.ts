import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const receipts = await prisma.receipt.findMany({ orderBy: { date: 'desc' } });
    return NextResponse.json(receipts.map((r: typeof receipts[0]) => ({ ...r, items: JSON.parse(r.items) })));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch receipts.' }, { status: 500 });
  }
}
