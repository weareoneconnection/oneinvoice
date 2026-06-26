import Anthropic from '@anthropic-ai/sdk';
import { Receipt } from './types';
import { rm } from './currency';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function explainEinvoiceError(error: string) {
  if (error.toLowerCase().includes('tin')) {
    return 'This looks like a TIN validation issue. Ask the buyer to confirm the TIN and ID/BRN combination, then resubmit.';
  }
  if (error.toLowerCase().includes('receipt')) {
    return 'The source receipt is missing or not eligible. Check whether it was already included in another individual or consolidated e-Invoice.';
  }
  return `AI explanation: ${error}. Review buyer data, mandatory e-Invoice fields, and retry submission in sandbox first.`;
}

export function monthlyInsight(receipts: Receipt[]) {
  const total = receipts.reduce((sum, r) => sum + r.total, 0);
  const sst = receipts.reduce((sum, r) => sum + r.sst, 0);
  const individual = receipts.filter((r) => r.status === 'individual_einvoice').reduce((sum, r) => sum + r.total, 0);
  const eligible = receipts.filter((r) => r.status === 'normal').reduce((sum, r) => sum + r.total, 0);
  return [
    `Total sales captured: ${rm(total)}.`,
    `SST captured: ${rm(sst)}.`,
    `Individual e-Invoice amount: ${rm(individual)}.`,
    `Eligible consolidated e-Invoice pool: ${rm(eligible)}.`,
    eligible > total * 0.7 ? 'Most transactions are B2C receipts. Consolidated e-Invoice automation is high priority.' : 'Individual e-Invoice usage is meaningful. Keep monitoring buyer request quality.'
  ];
}

export async function* streamAnswer(question: string, receipts: Receipt[]): AsyncGenerator<string> {
  const total = receipts.reduce((sum, r) => sum + r.total, 0);
  const sst = receipts.reduce((sum, r) => sum + r.sst, 0);
  const individual = receipts.filter((r) => r.status === 'individual_einvoice').length;
  const normal = receipts.filter((r) => r.status === 'normal').length;

  const systemPrompt = `You are an AI accountant for a Malaysia F&B restaurant using OneInvoice AI, an LHDN MyInvois e-Invoice compliance platform.

Current business data:
- Total receipts: ${receipts.length}
- Total sales: ${rm(total)}
- Total SST collected: ${rm(sst)}
- Receipts with individual e-Invoice: ${individual}
- B2C receipts eligible for consolidated e-Invoice: ${normal}
- Outlets: ${[...new Set(receipts.map((r) => r.outlet))].join(', ')}

Answer questions concisely in the same language as the user's question. Focus on actionable Malaysian e-Invoice compliance guidance. Keep answers under 200 words.`;

  const stream = client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [{ role: 'user', content: question }]
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
