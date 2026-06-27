import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'OneInvoice AI <noreply@oneai.network>';

// Vercel Cron: runs 25th of each month at 9:00 AM MYT (01:00 UTC)
// vercel.json sets: "0 1 25 * *"
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Find restaurants with unconsolidated normal receipts this month
  const receipts = await prisma.receipt.groupBy({
    by: ['restaurantId'],
    where: { status: 'normal', date: { gte: monthStart } },
    _count: { id: true },
    _sum: { total: true },
  });

  let sent = 0;
  for (const row of receipts) {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: row.restaurantId } });
    if (!restaurant) continue;

    const admins = await prisma.user.findMany({
      where: { restaurantId: restaurant.id },
      select: { email: true, name: true },
      take: 3,
    });
    if (!admins.length) continue;

    const count = row._count.id;
    const total = (row._sum.total ?? 0).toFixed(2);
    const to = admins.map(u => u.email);

    await resend.emails.send({
      from: FROM,
      to,
      subject: `Action Required: Submit Monthly Consolidated e-Invoice for ${month}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#111">Monthly e-Invoice Reminder</h2>
          <p>Hi ${admins[0].name ?? 'Team'},</p>
          <p>You have <strong>${count} receipts</strong> (RM ${total}) eligible for the monthly consolidated e-Invoice for <strong>${month}</strong>.</p>
          <p>Please submit the consolidated e-Invoice before month end to comply with LHDN requirements.</p>
          <a href="${process.env.NEXTAUTH_URL}/consolidated" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Submit Now</a>
          <p style="margin-top:24px;color:#888;font-size:12px">OneInvoice AI · Malaysia F&B e-Invoice Compliance Platform</p>
        </div>
      `,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, reminders: sent, month });
}
