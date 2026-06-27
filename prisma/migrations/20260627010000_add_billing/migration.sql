ALTER TABLE "Restaurant"
  ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_stripeCustomerId_key" ON "Restaurant"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_stripeSubscriptionId_key" ON "Restaurant"("stripeSubscriptionId");
