'use client';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { PLANS } from '@/lib/stripe';
import type { PlanKey } from '@/lib/stripe';

type Props = {
  currentPlan: PlanKey;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  plans: typeof PLANS;
  rmPrice: (sen: number) => string;
};

export default function BillingClient({ currentPlan, subscriptionStatus, currentPeriodEnd, plans, rmPrice }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function subscribe(plan: PlanKey) {
    if (plan === 'free') return;
    setLoading(plan);
    setError('');
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) { setError(data.error); return; }
    window.location.href = data.url;
  }

  async function openPortal() {
    setLoading('portal');
    setError('');
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) { setError(data.error); return; }
    window.location.href = data.url;
  }

  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Current Plan</p>
          <p className="text-2xl font-black capitalize">{plans[currentPlan].name}</p>
          {currentPeriodEnd && isActive && (
            <p className="text-sm text-slate-500">Renews {new Date(currentPeriodEnd).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          )}
          {subscriptionStatus === 'past_due' && (
            <p className="text-sm text-red-500 font-semibold">Payment past due — update payment method</p>
          )}
        </div>
        {currentPlan !== 'free' && (
          <button className="btn-outline" onClick={openPortal} disabled={loading === 'portal'}>
            {loading === 'portal' ? 'Opening…' : 'Manage Subscription'}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.entries(plans) as [PlanKey, typeof plans[PlanKey]][]).map(([key, plan]) => {
          const isCurrent = key === currentPlan;
          return (
            <div key={key} className={`card p-6 flex flex-col gap-4 ${isCurrent ? 'ring-2 ring-slate-900' : ''}`}>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black">{plan.name}</h2>
                  {isCurrent && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">Current</span>}
                </div>
                <p className="mt-1 text-3xl font-black">
                  {plan.price === 0 ? 'Free' : rmPrice(plan.price)}
                  {plan.price > 0 && <span className="text-base font-normal text-slate-500">/mo</span>}
                </p>
                {key !== 'free' && <p className="text-xs text-slate-500">14-day free trial</p>}
              </div>
              <ul className="flex-1 space-y-2">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} className="shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              {key === 'free' ? (
                <button className="btn-outline" disabled>Always Free</button>
              ) : isCurrent && isActive ? (
                <button className="btn-outline" onClick={openPortal} disabled={loading === 'portal'}>
                  {loading === 'portal' ? 'Opening…' : 'Manage'}
                </button>
              ) : (
                <button className="btn" onClick={() => subscribe(key)} disabled={!!loading}>
                  {loading === key ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
