import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getRestaurantPlan } from '@/lib/plan-guard';
import { PLANS, rmPrice } from '@/lib/stripe';
import PageHeader from '@/components/PageHeader';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session?.user.restaurantId;
  if (!restaurantId) redirect('/settings/restaurant');

  const planInfo = await getRestaurantPlan(restaurantId);

  return (
    <div>
      <PageHeader title="Billing & Plan" subtitle="Manage your OneInvoice AI subscription. All plans include a 14-day free trial." />
      <BillingClient currentPlan={planInfo?.key ?? 'free'} subscriptionStatus={planInfo?.subscriptionStatus} currentPeriodEnd={planInfo?.currentPeriodEnd?.toISOString()} plans={PLANS} rmPrice={rmPrice} />
    </div>
  );
}
