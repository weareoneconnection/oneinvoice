ALTER TABLE "Restaurant"
  ADD COLUMN IF NOT EXISTS "agencyId" TEXT,
  ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT;

ALTER TABLE "Restaurant"
  ADD CONSTRAINT "Restaurant_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Restaurant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
