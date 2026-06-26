import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const config = await prisma.myInvoisConfig.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' }
    });
    return NextResponse.json({
      mode: config.mode,
      apiConnection: config.apiConnection,
      taxpayerName: config.taxpayerName,
      taxpayerTin: config.taxpayerTin,
      lastSyncAt: config.lastSyncAt.toISOString()
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch MyInvois status.' }, { status: 500 });
  }
}
