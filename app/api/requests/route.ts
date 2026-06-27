import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMyInvoisAdapter } from '@/lib/myinvois';
import { requireRestaurant } from '@/lib/api-auth';
import { CustomerRequestSchema } from '@/lib/validation';
import { sendEInvoiceConfirmation } from '@/lib/email';
import { fireWebhook } from '@/lib/webhook';

export async function GET() {
  const { restaurantId, error } = await requireRestaurant();
  if (error) return error;
  try {
    const requests = await prisma.customerRequest.findMany({
      where: { restaurantId: restaurantId! },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch requests.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = CustomerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const receipt = await prisma.receipt.findFirst({
      where: data.receiptId ? { id: data.receiptId } : { receiptNo: data.receiptNo }
    });
    if (!receipt) return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    if (receipt.status !== 'normal') {
      return NextResponse.json({ error: 'Receipt has already been invoiced.' }, { status: 409 });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: receipt.restaurantId } });
    const myinvois = getMyInvoisAdapter(restaurant ? {
      clientId: restaurant.myInvoisClientId,
      clientSecret: restaurant.myInvoisClientSecret,
      mode: restaurant.myInvoisMode as 'sandbox' | 'production',
    } : null);

    const requestData = {
      restaurantId: receipt.restaurantId,
      receiptId: receipt.id,
      receiptNo: receipt.receiptNo,
      customerType: data.customerType,
      name: data.name,
      tin: data.tin,
      idType: data.idType,
      idNumber: data.idNumber,
      email: data.email,
      phone: data.phone ?? null,
      address: data.address,
      status: 'pending' as const,
    };

    const tinCheck = await myinvois.validateTin(data.tin, data.idNumber, data.idType);
    if (!tinCheck.ok) {
      const request = await prisma.customerRequest.create({
        data: { ...requestData, status: 'failed', error: tinCheck.error }
      });
      return NextResponse.json(request, { status: 422 });
    }

    const tempRequest = { id: 'temp', createdAt: new Date(), myInvoisDocumentId: undefined, error: undefined, ...requestData };
    const result = await myinvois.submitIndividualEInvoice(
      tempRequest as unknown as Parameters<typeof myinvois.submitIndividualEInvoice>[0],
      restaurant?.name,
      restaurant?.tin
    );

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
      sendEInvoiceConfirmation({
        to: data.email,
        buyerName: data.name,
        receiptNo: receipt.receiptNo,
        documentId: result.documentId ?? '',
        amount: receipt.total,
      }).catch(() => {});
      fireWebhook(receipt.restaurantId, {
        event: 'einvoice.validated',
        documentId: result.documentId ?? '',
        receiptNo: receipt.receiptNo,
        buyerName: data.name,
        amount: receipt.total,
      }).catch(() => {});
    }

    return NextResponse.json(request);
  } catch {
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 });
  }
}
