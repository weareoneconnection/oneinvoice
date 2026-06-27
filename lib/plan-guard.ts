import { prisma } from './prisma';
import { PLANS, getPlan } from './stripe';

export type PlanLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; upgradeRequired: PlanKey };

import type { PlanKey } from './stripe';

export async function checkReceiptLimit(restaurantId: string): Promise<PlanLimitResult> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { plan: true, subscriptionStatus: true }
  });
  if (!restaurant) return { allowed: false, reason: 'Restaurant not found.', upgradeRequired: 'starter' };

  const plan = getPlan(restaurant.plan);
  const limit = PLANS[plan].receiptsPerMonth;
  if (limit === Infinity) return { allowed: true };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = await prisma.receipt.count({
    where: { restaurantId, createdAt: { gte: monthStart } }
  });

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Free plan limit reached (${limit} receipts/month). Upgrade to import more.`,
      upgradeRequired: 'starter',
    };
  }
  return { allowed: true };
}

export async function getRestaurantPlan(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true, trialEndsAt: true }
  });
  if (!restaurant) return null;
  const key = getPlan(restaurant.plan);
  return { ...restaurant, key, meta: PLANS[key] };
}
