-- CreateTable: Restaurant
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tin" TEXT NOT NULL DEFAULT '',
    "myInvoisClientId" TEXT NOT NULL DEFAULT '',
    "myInvoisClientSecret" TEXT NOT NULL DEFAULT '',
    "myInvoisMode" TEXT NOT NULL DEFAULT 'sandbox',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- Insert a default restaurant for existing data
INSERT INTO "Restaurant" ("id", "name", "tin", "myInvoisMode", "createdAt")
VALUES ('default_restaurant', 'Default Restaurant', '', 'sandbox', CURRENT_TIMESTAMP);

-- AlterTable: User — add restaurantId (nullable first)
ALTER TABLE "User" ADD COLUMN "restaurantId" TEXT;

-- Update existing users to belong to default restaurant
UPDATE "User" SET "restaurantId" = 'default_restaurant';

-- AlterTable: Receipt — add restaurantId (nullable first, then fill, then make required)
ALTER TABLE "Receipt" ADD COLUMN "restaurantId" TEXT;
UPDATE "Receipt" SET "restaurantId" = 'default_restaurant';
ALTER TABLE "Receipt" ALTER COLUMN "restaurantId" SET NOT NULL;

-- AlterTable: CustomerRequest
ALTER TABLE "CustomerRequest" ADD COLUMN "restaurantId" TEXT;
UPDATE "CustomerRequest" SET "restaurantId" = 'default_restaurant';
ALTER TABLE "CustomerRequest" ALTER COLUMN "restaurantId" SET NOT NULL;

-- AlterTable: ConsolidatedBatch
ALTER TABLE "ConsolidatedBatch" ADD COLUMN "restaurantId" TEXT;
UPDATE "ConsolidatedBatch" SET "restaurantId" = 'default_restaurant';
ALTER TABLE "ConsolidatedBatch" ALTER COLUMN "restaurantId" SET NOT NULL;

-- Drop old unique constraint on Receipt (receiptNo) and add new composite one
ALTER TABLE "Receipt" DROP CONSTRAINT IF EXISTS "Receipt_receiptNo_key";
CREATE UNIQUE INDEX "Receipt_restaurantId_receiptNo_key" ON "Receipt"("restaurantId", "receiptNo");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "CustomerRequest_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConsolidatedBatch" ADD CONSTRAINT "ConsolidatedBatch_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
