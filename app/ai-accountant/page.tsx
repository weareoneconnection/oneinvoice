import PageHeader from '@/components/PageHeader';
import { monthlyInsight } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import ChatBox from './ChatBox';

export default async function AiAccountantPage() {
  const receipts = await prisma.receipt.findMany();
  const insights = monthlyInsight(receipts.map((r: typeof receipts[0]) => ({ ...r, items: JSON.parse(r.items), date: r.date.toISOString() })) as import('@/lib/types').Receipt[]);
  return (
    <div>
      <PageHeader title="AI Accountant" subtitle="Natural language assistant powered by Claude AI. Ask about your receipts, SST, consolidated e-Invoice eligibility, or compliance guidance." />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChatBox /></div>
        <div className="card p-5">
          <h2 className="text-lg font-black">Monthly Pack Summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {insights.map((x) => <p key={x}>{x}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
