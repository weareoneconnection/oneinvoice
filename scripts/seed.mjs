import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL_UNPOOLED, {});
const prisma = new PrismaClient({ adapter });

const now = new Date();
const month = now.toISOString().slice(0, 7);

const RESTAURANT_ID = 'demo_restaurant';

async function main() {
  // Ensure demo restaurant exists
  const existingRestaurant = await prisma.restaurant.findUnique({ where: { id: RESTAURANT_ID } });
  if (!existingRestaurant) {
    await prisma.restaurant.create({
      data: { id: RESTAURANT_ID, name: 'Demo Restaurant Sdn Bhd', tin: 'C1234567890', myInvoisMode: 'sandbox' }
    });
    console.log('Created demo restaurant');
  } else {
    console.log('Demo restaurant already exists, skipping');
  }

  // Create admin user linked to demo restaurant
  const existing = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('demo1234', 10);
    await prisma.user.create({ data: { email: 'admin@demo.com', passwordHash, name: 'Admin', restaurantId: RESTAURANT_ID } });
    console.log('Created admin@demo.com / demo1234');
  } else {
    // Link to restaurant if not already
    if (!existing.restaurantId) {
      await prisma.user.update({ where: { id: existing.id }, data: { restaurantId: RESTAURANT_ID } });
      console.log('Linked admin@demo.com to demo restaurant');
    } else {
      console.log('admin@demo.com already exists, skipping');
    }
  }

  const receipts = Array.from({ length: 18 }).map((_, i) => {
    const total = [28.9, 45.5, 78.2, 112.4, 19.9, 63.7][i % 6];
    const sst = +(total * 0.06).toFixed(2);
    return {
      id: `rec_seed_${i + 1}`,
      restaurantId: RESTAURANT_ID,
      receiptNo: `OI-${month.replace('-', '')}-${String(i + 1).padStart(4, '0')}`,
      outlet: i % 3 === 0 ? 'KLCC Outlet' : i % 3 === 1 ? 'Bukit Bintang Outlet' : 'Main Outlet',
      channel: i % 4 === 0 ? 'delivery' : i % 4 === 1 ? 'takeaway' : 'dine_in',
      date: new Date(`${month}-${String((i % 26) + 1).padStart(2, '0')}T12:00:00.000Z`),
      subtotal: +(total / 1.06).toFixed(2),
      serviceCharge: 0,
      sst,
      discount: 0,
      rounding: 0,
      total,
      status: 'normal',
      items: JSON.stringify([{ description: 'F&B sales', quantity: 1, unitPrice: total, amount: total }])
    };
  });

  let created = 0;
  for (const r of receipts) {
    const exists = await prisma.receipt.findUnique({ where: { id: r.id } });
    if (!exists) {
      await prisma.receipt.create({ data: r });
      created++;
    }
  }
  console.log(`Seeded ${created} receipts (${receipts.length - created} already existed)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
