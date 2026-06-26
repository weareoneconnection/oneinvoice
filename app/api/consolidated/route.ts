import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMyInvoisAdapter } from '@/lib/myinvois';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const batches = await prisma.consolidatedBatch.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(batches.map((b: typeof batches[0]) => ({ ...b, receiptIds: JSON.parse(b.receiptIds) })));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch batches.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json();
    const month = body.month ?? new Date().toISOString().slice(0, 7);
    const outlet = body.outlet ?? 'ALL';

    const allReceipts = await prisma.receipt.findMany({ where: { status: 'normal' } });
    const eligible = allReceipts.filter((r) => {
      const receiptMonth = r.date.toISOString().slice(0, 7);
      return receiptMonth === month && (outlet === 'ALL' || r.outlet === outlet);
    });

    const amount = eligible.reduce((s, r) => s + r.total, 0);
    const sst = eligible.reduce((s, r) => s + r.sst, 0);

    const batchData = {
      month,
      outlet,
      receiptCount: eligible.length,
      amount,
      sst,
      status: 'draft',
      receiptIds: JSON.stringify(eligible.map((r) => r.id)),
    };

    if (body.submit === true) {
      const myinvois = getMyInvoisAdapter();
      const tempBatch = { id: 'temp', createdAt: new Date(), myInvoisSubmissionId: undefined, ...batchData };
      const result = await myinvois.submitConsolidatedEInvoice(tempBatch as unknown as Parameters<typeof myinvois.submitConsolidatedEInvoice>[0]);
      if (result.ok) {
        batchData.status = 'validated';
        await prisma.receipt.updateMany({
          where: { id: { in: eligible.map((r) => r.id) } },
          data: { status: 'consolidated' }
        });
        const batch = await prisma.consolidatedBatch.create({
          data: { ...batchData, myInvoisSubmissionId: result.submissionId }
        });
        return NextResponse.json({ ...batch, receiptIds: JSON.parse(batch.receiptIds) });
      } else {
        batchData.status = 'failed';
      }
    }

    const batch = await prisma.consolidatedBatch.create({ data: batchData });
    return NextResponse.json({ ...batch, receiptIds: JSON.parse(batch.receiptIds) });
  } catch {
    return NextResponse.json({ error: 'Failed to create batch.' }, { status: 500 });
  }
}
