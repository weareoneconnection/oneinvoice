import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { explainEinvoiceError } from '@/lib/ai';

type RequestRow = Awaited<ReturnType<typeof prisma.customerRequest.findMany>>[0];

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session?.user.restaurantId;
  if (!restaurantId) redirect('/settings/restaurant');

  const requests = await prisma.customerRequest.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <PageHeader title="Customer e-Invoice Requests" subtitle="Buyer-submitted e-Invoice requests from receipt QR links. Failed requests include AI-readable issue explanations." />
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-3">Receipt</th><th>Buyer</th><th>TIN</th><th>Email</th><th>Status</th><th>MyInvois ID / AI Note</th><th>PDF</th></tr>
          </thead>
          <tbody>
            {requests.map((r: RequestRow) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-semibold">{r.receiptNo}</td>
                <td>{r.name}</td>
                <td>{r.tin}</td>
                <td>{r.email}</td>
                <td><StatusBadge value={r.status} /></td>
                <td className="max-w-md">{r.myInvoisDocumentId ?? (r.error ? explainEinvoiceError(r.error) : '-')}</td>
                <td>
                  {r.myInvoisDocumentId && (
                    <a href={`/api/invoices/${r.id}/pdf`} target="_blank" className="font-semibold text-slate-900 underline text-xs">PDF</a>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No customer requests yet. Open a receipt QR page and submit one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
