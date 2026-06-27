/**
 * Generates a Malaysian e-Invoice PDF using jsPDF.
 * Returns a Buffer suitable for HTTP response or email attachment.
 */

type InvoicePdfParams = {
  documentId: string;
  receiptNo: string;
  issueDate: string;
  sellerName: string;
  sellerTin: string;
  buyerName: string;
  buyerTin: string;
  buyerEmail: string;
  buyerAddress: string;
  lineTotal: number;
  sst: number;
  serviceCharge: number;
  grandTotal: number;
};

export async function generateInvoicePdf(params: InvoicePdfParams): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jspdf: any = await import('jspdf');
  const JsPDF = jspdf.jsPDF ?? jspdf.default;
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });

  const primary = [20, 20, 20] as const;
  const muted   = [100, 100, 100] as const;
  const light   = [230, 230, 230] as const;

  const lm = 20, rm = 190, tw = rm - lm;

  // Header bar
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('OneInvoice AI', lm, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Malaysia F&B e-Invoice Platform', lm, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('e-INVOICE', rm, 13, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document: ${params.documentId}`, rm, 20, { align: 'right' });

  doc.setTextColor(...primary);

  // Seller / Buyer side by side
  let y = 40;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...muted);
  doc.text('SELLER', lm, y);
  doc.text('BUYER', 110, y);
  y += 5;
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(params.sellerName, lm, y);
  doc.text(params.buyerName, 110, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`TIN: ${params.sellerTin}`, lm, y);
  doc.text(`TIN: ${params.buyerTin}`, 110, y);
  y += 5;
  doc.text(`Issue Date: ${params.issueDate}`, lm, y);
  doc.text(params.buyerEmail, 110, y);
  y += 5;
  doc.text(`Receipt No: ${params.receiptNo}`, lm, y);
  const addrLines = doc.splitTextToSize(params.buyerAddress, 80);
  doc.text(addrLines, 110, y);
  y += Math.max(8, addrLines.length * 5);

  // Divider
  y += 4;
  doc.setDrawColor(...light);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rm, y);
  y += 6;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(lm, y, tw, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text('DESCRIPTION', lm + 2, y + 5);
  doc.text('AMOUNT (MYR)', rm - 2, y + 5, { align: 'right' });
  y += 10;

  // Line items
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'normal');
  doc.text('F&B Sales', lm + 2, y);
  doc.text(`RM ${params.lineTotal.toFixed(2)}`, rm - 2, y, { align: 'right' });
  y += 6;
  if (params.serviceCharge > 0) {
    doc.text('Service Charge', lm + 2, y);
    doc.text(`RM ${params.serviceCharge.toFixed(2)}`, rm - 2, y, { align: 'right' });
    y += 6;
  }

  // Subtotals
  y += 2;
  doc.setDrawColor(...light);
  doc.line(rm - 60, y, rm, y);
  y += 5;

  const rows = [
    ['Subtotal', params.lineTotal + params.serviceCharge],
    ['SST (6%)', params.sst],
  ];
  for (const [label, val] of rows) {
    doc.setTextColor(...muted);
    doc.text(label as string, rm - 58, y);
    doc.setTextColor(...primary);
    doc.text(`RM ${(val as number).toFixed(2)}`, rm - 2, y, { align: 'right' });
    y += 6;
  }

  // Grand total box
  y += 2;
  doc.setFillColor(20, 20, 20);
  doc.rect(rm - 62, y, 62, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL PAYABLE', rm - 60, y + 7);
  doc.text(`RM ${params.grandTotal.toFixed(2)}`, rm - 2, y + 7, { align: 'right' });

  // Footer
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('This document is electronically generated. Verify at myinvois.hasil.gov.my', 105, 285, { align: 'center' });
  doc.text(`Document ID: ${params.documentId}`, 105, 289, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
