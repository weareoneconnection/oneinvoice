import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRestaurant } from '@/lib/api-auth';
import { generateInvoicePdf } from '@/lib/invoice-pdf';

export async function GET(_req: Request, { params }: { params: { requestId: string } }) {
  const { restaurantId, error } = await requireRestaurant();
  if (error) return error;

  const request = await prisma.customerRequest.findFirst({
    where: { id: params.requestId, restaurantId: restaurantId! }
  });
  if (!request) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (!request.myInvoisDocumentId) return NextResponse.json({ error: 'e-Invoice not yet validated.' }, { status: 400 });

  const receipt = await prisma.receipt.findUnique({ where: { id: request.receiptId } });
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId! } });

  const pdf = await generateInvoicePdf({
    documentId: request.myInvoisDocumentId,
    receiptNo: request.receiptNo,
    issueDate: request.createdAt.toISOString().slice(0, 10),
    sellerName: restaurant?.name ?? '',
    sellerTin: restaurant?.tin ?? '',
    buyerName: request.name,
    buyerTin: request.tin,
    buyerEmail: request.email,
    buyerAddress: request.address,
    lineTotal: receipt?.subtotal ?? 0,
    sst: receipt?.sst ?? 0,
    serviceCharge: receipt?.serviceCharge ?? 0,
    grandTotal: receipt?.total ?? 0,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="einvoice-${request.receiptNo}.pdf"`,
    }
  });
}
