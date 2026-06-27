/**
 * Outbound webhook: fires when e-Invoice status changes.
 * Restaurant admins can set a webhookUrl in Restaurant Settings
 * to receive real-time notifications in their POS or ERP system.
 */

import { prisma } from './prisma';

type WebhookEvent =
  | { event: 'einvoice.validated'; documentId: string; receiptNo: string; buyerName: string; amount: number }
  | { event: 'einvoice.failed';    receiptNo: string; error: string }
  | { event: 'consolidated.submitted'; submissionId: string; month: string; receiptCount: number; amount: number };

export async function fireWebhook(restaurantId: string, payload: WebhookEvent) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { webhookUrl: true }
  });
  if (!restaurant?.webhookUrl) return;

  try {
    await fetch(restaurant.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OneInvoice-Event': payload.event },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-blocking — webhook failure must not affect main flow
  }
}
