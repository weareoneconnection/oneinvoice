import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { prisma } from '@/lib/prisma';

export default async function MyInvoisPage() {
  const config = await prisma.myInvoisConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' }
  });
  return (
    <div>
      <PageHeader title="MyInvois Center" subtitle="Sandbox gateway status for LHDN MyInvois. Replace the mock gateway in lib/myinvois.ts with official API credentials when ready." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mode" value={config.mode} hint="Use sandbox before production submission" />
        <StatCard label="API Connection" value={config.apiConnection} hint="Currently mocked for local MVP" />
        <StatCard label="Taxpayer TIN" value={config.taxpayerTin} hint={config.taxpayerName} />
        <StatCard label="Last Sync" value={config.lastSyncAt.toISOString().slice(0, 10)} hint="Local data store" />
      </div>
      <div className="card mt-6 p-5">
        <h2 className="text-lg font-black">Gateway Roadmap</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {['OAuth token management', 'TIN validation', 'Submit documents', 'Poll submission status', 'Get recent documents', 'Cancel / reject documents', 'Error code translation', 'Audit log'].map((x, i) => (
            <div key={x} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <span className="font-semibold">{x}</span>
              <StatusBadge value={i < 4 ? 'mocked' : 'planned'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
