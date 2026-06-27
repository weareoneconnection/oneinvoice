import Stripe from 'stripe';

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
      apiVersion: '2026-06-24.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

// Named export for convenience in routes
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    return getStripe()[prop as keyof Stripe];
  }
});

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'MYR',
    receiptsPerMonth: 50,
    users: 1,
    outlets: 1,
    features: ['50 receipts/month', '1 user', 'Sandbox MyInvois', 'AI Accountant'],
  },
  starter: {
    name: 'Starter',
    price: 9900,
    currency: 'MYR',
    receiptsPerMonth: Infinity,
    users: 3,
    outlets: 1,
    get stripePriceId() { return process.env.STRIPE_PRICE_STARTER ?? ''; },
    features: ['Unlimited receipts', '3 users', 'Live MyInvois API', 'Email e-Invoice', 'Priority support'],
  },
  pro: {
    name: 'Pro',
    price: 29900,
    currency: 'MYR',
    receiptsPerMonth: Infinity,
    users: Infinity,
    outlets: Infinity,
    get stripePriceId() { return process.env.STRIPE_PRICE_PRO ?? ''; },
    features: ['Unlimited receipts', 'Unlimited users', 'Multi-outlet', 'Live MyInvois API', 'Email e-Invoice', 'Dedicated support'],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlan(key: string): PlanKey {
  if (key === 'starter' || key === 'pro') return key;
  return 'free';
}

export function rmPrice(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`;
}
