import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RequestForm from './RequestForm';

export default async function CustomerReceiptPage({ params }: { params: { receiptId: string } }) {
  const receipt = await prisma.receipt.findUnique({ where: { id: params.receiptId } });
  if (!receipt) notFound();
  return <RequestForm receiptId={receipt.id} receiptNo={receipt.receiptNo} />;
}
