import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { rm } from '@/lib/currency';
import { monthlyInsight } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Receipt } from '@/lib/types';

type ReceiptRow = Awaited<ReturnType<typeof prisma.receipt.findMany>>[0];
type RequestRow = Awaited<ReturnType<typeof prisma.customerRequest.findMany>>[0];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session?.user.restaurantId;
  if (!restaurantId) redirect('/settings/restaurant');

  const [receipts, requests] = await Promise.all([
    prisma.receipt.findMany({ where: { restaurantId }, orderBy: { date: 'desc' } }),
    prisma.customerRequest.findMany({ where: { restaurantId } })
  ]);

  const total = receipts.reduce((s: number, r: ReceiptRow) => s + r.total, 0);
  const sst = receipts.reduce((s: number, r: ReceiptRow) => s + r.sst, 0);
  const pending = requests.filter((r: RequestRow) => r.status === 'pending' || r.status === 'failed').length;
  const pool = receipts.filter((r: ReceiptRow) => r.status === 'normal').reduce((s: number, r: ReceiptRow) => s + r.total, 0);
  const insights = monthlyInsight(receipts.map((r: ReceiptRow) => ({ ...r, items: JSON.parse(r.items), date: r.date.toISOString() })) as Receipt[]);

  return (
    <div>
      <PageHeader title="F&B e-Invoice Compliance Dashboard" subtitle="Track POS receipts, customer e-Invoice requests, consolidated e-Invoice pool, and MyInvois readiness for Malaysian restaurants." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales Captured" value={rm(total)} hint={`${receipts.length} receipts`} />
        <StatCard label="SST Captured" value={rm(sst)} hint="Based on uploaded receipts" />
        <StatCard label="Consolidated Pool" value={rm(pool)} hint="Normal B2C receipts not individually invoiced" />
        <StatCard label="Attention Needed" value={String(pending)} hint="Pending or failed customer requests" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-lg font-black">Recent Receipts</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Receipt</th><th>Outlet</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {receipts.slice(0, 8).map((r: ReceiptRow) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-semibold">{r.receiptNo}</td>
                    <td>{r.outlet}</td>
                    <td>{rm(r.total)}</td>
                    <td><StatusBadge value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-black">AI Compliance Insight</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {insights.map((x: string) => <p key={x}>{x}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
