import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? 'OneInvoice AI <noreply@oneai.network>';

export async function sendEInvoiceConfirmation({
  to,
  buyerName,
  receiptNo,
  documentId,
  amount,
}: {
  to: string;
  buyerName: string;
  receiptNo: string;
  documentId: string;
  amount: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your e-Invoice is ready — ${receiptNo}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h1 style="font-size:20px;font-weight:900;margin-bottom:8px">e-Invoice Confirmed</h1>
        <p style="color:#555">Hi ${buyerName},</p>
        <p style="color:#555">Your individual e-Invoice has been submitted and validated on LHDN MyInvois.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#888;font-size:14px">Receipt No.</td>
            <td style="padding:10px 0;font-weight:600;text-align:right">${receiptNo}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:10px 0;color:#888;font-size:14px">Amount</td>
            <td style="padding:10px 0;font-weight:600;text-align:right">MYR ${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#888;font-size:14px">MyInvois Document ID</td>
            <td style="padding:10px 0;font-weight:600;text-align:right;font-size:12px;word-break:break-all">${documentId}</td>
          </tr>
        </table>
        <p style="color:#888;font-size:13px">You can retrieve your e-Invoice from the LHDN MyTax portal using the Document ID above.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#bbb;font-size:12px">Powered by OneInvoice AI · Malaysia e-Invoice Compliance</p>
      </div>
    `,
  });
}
