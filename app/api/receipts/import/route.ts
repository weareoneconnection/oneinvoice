import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import { requireRestaurant } from '@/lib/api-auth';
import { CsvRowSchema } from '@/lib/validation';

function num(v: unknown) {
  const n = Number(String(v ?? '0').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function str(row: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const found = Object.keys(row).find((k) => k.toLowerCase().trim() === key.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== '') return String(row[found]);
  }
  return fallback;
}

export async function POST(req: Request) {
  const { restaurantId, error } = await requireRestaurant();
  if (error) return error;
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'CSV file is required.' }, { status: 400 });
    const text = await file.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });

    const existingNos = new Set(
      (await prisma.receipt.findMany({ where: { restaurantId: restaurantId! }, select: { receiptNo: true } }))
        .map((r: { receiptNo: string }) => r.receiptNo)
    );

    const toCreate = [];
    const validationErrors: string[] = [];

    for (const row of parsed.data) {
      const receiptNo = str(row, ['receiptNo', 'receipt_no', 'bill_no', 'invoice_no', 'order_no'], `R-${Date.now()}`);
      if (existingNos.has(receiptNo)) continue;
      existingNos.add(receiptNo);
      const subtotal = num(str(row, ['subtotal', 'net_total', 'amount_excluding_tax', 'sales'], '0'));
      const serviceCharge = num(str(row, ['serviceCharge', 'service_charge', 'svc_charge'], '0'));
      const sst = num(str(row, ['sst', 'tax', 'tax_amt'], '0'));
      const discount = num(str(row, ['discount'], '0'));
      const rounding = num(str(row, ['rounding'], '0'));
      const total = num(str(row, ['total', 'grand_total', 'payable_amount'], String(subtotal + serviceCharge + sst - discount + rounding)));
      const rawDate = str(row, ['date', 'datetime', 'created_at'], new Date().toISOString());

      const validated = CsvRowSchema.safeParse({ receiptNo, subtotal, serviceCharge, sst, discount, rounding, total, date: rawDate });
      if (!validated.success) {
        validationErrors.push(`Row ${receiptNo}: ${validated.error.errors.map((e) => e.message).join(', ')}`);
        continue;
      }

      toCreate.push({
        restaurantId: restaurantId!,
        receiptNo,
        outlet: str(row, ['outlet', 'branch', 'location'], 'Main Outlet'),
        channel: str(row, ['channel', 'type'], 'dine_in'),
        date: new Date(rawDate),
        subtotal, serviceCharge, sst, discount, rounding, total,
        status: 'normal',
        items: JSON.stringify([{ description: str(row, ['item', 'description'], 'F&B sales'), quantity: 1, unitPrice: total, amount: total }])
      });
    }

    await prisma.receipt.createMany({ data: toCreate });
    return NextResponse.json({
      imported: toCreate.length,
      skipped: parsed.data.length - toCreate.length - validationErrors.length,
      errors: validationErrors,
    });
  } catch {
    return NextResponse.json({ error: 'Import failed.' }, { status: 500 });
  }
}
