import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { prisma } from '@/lib/prisma';
import { explainEinvoiceError } from '@/lib/ai';

export default async function RequestsPage() {
  const requests = await prisma.customerRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <PageHeader title="Customer e-Invoice Requests" subtitle="Buyer-submitted e-Invoice requests from receipt QR links. Failed requests include AI-readable issue explanations." />
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-3">Receipt</th><th>Buyer</th><th>TIN</th><th>Email</th><th>Status</th><th>MyInvois ID / AI Note</th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-semibold">{r.receiptNo}</td>
                <td>{r.name}</td>
                <td>{r.tin}</td>
                <td>{r.email}</td>
                <td><StatusBadge value={r.status} /></td>
                <td className="max-w-md">{r.myInvoisDocumentId ?? (r.error ? explainEinvoiceError(r.error) : '-')}</td>
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
