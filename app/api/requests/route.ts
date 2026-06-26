import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMyInvoisAdapter } from '@/lib/myinvois';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const requests = await prisma.customerRequest.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(requests);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch requests.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const receipt = await prisma.receipt.findFirst({
      where: body.receiptId ? { id: body.receiptId } : { receiptNo: body.receiptNo }
    });
    if (!receipt) return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    if (receipt.status !== 'normal') {
      return NextResponse.json({ error: 'Receipt has already been invoiced.' }, { status: 409 });
    }

    const myinvois = getMyInvoisAdapter();
    const requestData = {
      receiptId: receipt.id,
      receiptNo: receipt.receiptNo,
      customerType: body.customerType ?? 'individual',
      name: body.name,
      tin: body.tin,
      idType: body.idType ?? 'NRIC',
      idNumber: body.idNumber,
      email: body.email,
      phone: body.phone ?? null,
      address: body.address,
      status: 'pending' as const,
    };

    const tinCheck = await myinvois.validateTin(body.tin, body.idNumber);
    if (!tinCheck.ok) {
      const request = await prisma.customerRequest.create({
        data: { ...requestData, status: 'failed', error: tinCheck.error }
      });
      return NextResponse.json(request, { status: 422 });
    }

    const tempRequest = { id: 'temp', createdAt: new Date(), myInvoisDocumentId: undefined, error: undefined, ...requestData };
    const result = await myinvois.submitIndividualEInvoice(tempRequest as unknown as Parameters<typeof myinvois.submitIndividualEInvoice>[0]);

    const request = await prisma.customerRequest.create({
      data: {
        ...requestData,
        status: result.ok ? 'validated' : 'failed',
        myInvoisDocumentId: result.ok ? result.documentId : null,
        error: result.ok ? null : result.error,
      }
    });

    if (result.ok) {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'individual_einvoice', customerRequestId: request.id }
      });
    }

    return NextResponse.json(request);
  } catch {
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 });
  }
}
