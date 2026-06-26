import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { rm } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import ImportForm from './ImportForm';

type ReceiptRow = Awaited<ReturnType<typeof prisma.receipt.findMany>>[0];

export default async function ReceiptsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session?.user.restaurantId;
  if (!restaurantId) redirect('/settings/restaurant');

  const receipts = await prisma.receipt.findMany({ where: { restaurantId }, orderBy: { date: 'desc' } });
  return (
    <div>
      <PageHeader title="Receipts" subtitle="Import POS receipts and generate customer e-Invoice request links. Receipts not individually invoiced are eligible for monthly consolidated e-Invoice." />
      <ImportForm />
      <div className="card mt-5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-3">Receipt</th><th>Date</th><th>Outlet</th><th>Channel</th><th>Total</th><th>Status</th><th>Customer Link</th></tr>
          </thead>
          <tbody>
            {receipts.map((r: ReceiptRow) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-semibold">{r.receiptNo}</td>
                <td>{r.date.toISOString().slice(0, 10)}</td>
                <td>{r.outlet}</td>
                <td>{r.channel}</td>
                <td>{rm(r.total)}</td>
                <td><StatusBadge value={r.status} /></td>
                <td><a className="font-semibold text-slate-900 underline" href={`/r/${r.id}`}>Open QR page</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
