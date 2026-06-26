import { prisma } from '@/lib/prisma';
import { streamAnswer } from '@/lib/ai';

export async function POST(req: Request) {
  const { question } = await req.json();
  const rows = await prisma.receipt.findMany();
  const receipts = rows.map((r) => ({ ...r, items: JSON.parse(r.items), date: r.date.toISOString() })) as import('@/lib/types').Receipt[];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAnswer(question || '', receipts)) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
  });
}

