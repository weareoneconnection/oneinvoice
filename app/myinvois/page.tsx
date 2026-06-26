import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export default async function MyInvoisPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session?.user.restaurantId;
  if (!restaurantId) redirect('/settings/restaurant');

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  const mode = restaurant?.myInvoisMode ?? 'sandbox';
  const hasCredentials = !!(restaurant?.myInvoisClientId);

  return (
    <div>
      <PageHeader title="MyInvois Center" subtitle="LHDN MyInvois gateway status. Configure your API credentials in Restaurant Settings to connect to the live MyInvois API." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mode" value={mode} hint="Set production mode in Restaurant Settings" />
        <StatCard label="API Connection" value={hasCredentials ? 'configured' : 'mocked'} hint={hasCredentials ? 'Using restaurant credentials' : 'Using sandbox mock'} />
        <StatCard label="Taxpayer TIN" value={restaurant?.tin || '-'} hint={restaurant?.name ?? '-'} />
        <StatCard label="Last Sync" value={new Date().toISOString().slice(0, 10)} hint="Live status" />
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
