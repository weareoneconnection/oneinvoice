import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { rm } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import CreateBatchForm from './CreateBatchForm';

type BatchRow = Awaited<ReturnType<typeof prisma.consolidatedBatch.findMany>>[0];

export default async function ConsolidatedPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session?.user.restaurantId;
  if (!restaurantId) redirect('/settings/restaurant');

  const [receipts, batches] = await Promise.all([
    prisma.receipt.findMany({ where: { restaurantId }, select: { outlet: true } }),
    prisma.consolidatedBatch.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' } })
  ]);
  const outlets: string[] = Array.from(new Set(receipts.map((r: { outlet: string }) => r.outlet)));
  return (
    <div>
      <PageHeader title="Monthly Consolidated e-Invoice" subtitle="Generate monthly consolidated e-Invoice batches for B2C receipts where customers did not request individual e-Invoice." />
      <CreateBatchForm outlets={outlets} />
      <div className="card mt-5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-3">Batch</th><th>Month</th><th>Outlet</th><th>Receipts</th><th>Amount</th><th>SST</th><th>Status</th><th>Submission ID</th></tr>
          </thead>
          <tbody>
            {batches.map((b: BatchRow) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-semibold">{b.id.slice(-8)}</td>
                <td>{b.month}</td>
                <td>{b.outlet}</td>
                <td>{b.receiptCount}</td>
                <td>{rm(b.amount)}</td>
                <td>{rm(b.sst)}</td>
                <td><StatusBadge value={b.status} /></td>
                <td>{b.myInvoisSubmissionId ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
