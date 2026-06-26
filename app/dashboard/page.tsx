import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { rm } from '@/lib/currency';
import { monthlyInsight } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const [receipts, requests] = await Promise.all([
    prisma.receipt.findMany({ orderBy: { date: 'desc' } }),
    prisma.customerRequest.findMany()
  ]);

  const total = receipts.reduce((s, r) => s + r.total, 0);
  const sst = receipts.reduce((s, r) => s + r.sst, 0);
  const pending = requests.filter((r) => r.status === 'pending' || r.status === 'failed').length;
  const pool = receipts.filter((r) => r.status === 'normal').reduce((s, r) => s + r.total, 0);
  const insights = monthlyInsight(receipts.map((r) => ({ ...r, items: JSON.parse(r.items), date: r.date.toISOString() })) as import('@/lib/types').Receipt[]);

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
                {receipts.slice(0, 8).map((r) => (
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
            {insights.map((x) => <p key={x}>{x}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
