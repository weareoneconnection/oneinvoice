/**
 * LHDN MyInvois REST API adapter (sandbox + production)
 * Sandbox base: https://preprod-api.myinvois.hasil.gov.my
 * Production base: https://api.myinvois.hasil.gov.my
 */

import type { RestaurantCredentials } from './myinvois';

const SANDBOX_BASE = 'https://preprod-api.myinvois.hasil.gov.my';
const PROD_BASE    = 'https://api.myinvois.hasil.gov.my';

type TokenCache = { token: string; expiresAt: number };
const tokenCache = new Map<string, TokenCache>();

async function getAccessToken(creds: RestaurantCredentials): Promise<string> {
  const key = creds.clientId;
  const cached = tokenCache.get(key);
  if (cached && Date.now() < cached.expiresAt - 30_000) return cached.token;

  const base = creds.mode === 'production' ? PROD_BASE : SANDBOX_BASE;
  const res = await fetch(`${base}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      scope: 'InvoicingAPI',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MyInvois auth failed: ${res.status} ${text}`);
  }
  const json = await res.json() as { access_token: string; expires_in: number };
  tokenCache.set(key, { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 });
  return json.access_token;
}

export async function validateTinLive(creds: RestaurantCredentials, tin: string, idType: string, idNumber: string) {
  const token = await getAccessToken(creds);
  const base = creds.mode === 'production' ? PROD_BASE : SANDBOX_BASE;
  const res = await fetch(`${base}/api/v1.0/taxpayer/validate/${tin}?idType=${idType}&idValue=${idNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200) return { ok: true };
  if (res.status === 404) return { ok: false, error: 'TIN not found in LHDN records.' };
  const err = await res.json().catch(() => ({}));
  return { ok: false, error: (err as { message?: string }).message ?? `Validation failed (${res.status})` };
}

type InvoiceDocument = {
  receiptNo: string;
  issueDate: string;      // YYYY-MM-DD
  issueTime: string;      // HH:MM:SSZ
  sellerTin: string;
  sellerName: string;
  buyerTin: string;
  buyerName: string;
  buyerIdType: string;
  buyerIdNumber: string;
  buyerEmail: string;
  buyerAddress: string;
  lineTotal: number;      // MYR
  taxAmount: number;
  grandTotal: number;
};

function buildUBLDocument(doc: InvoiceDocument) {
  const now = new Date();
  return {
    _D: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    _A: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    _B: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    Invoice: [{
      ID: [{ _: doc.receiptNo }],
      IssueDate: [{ _: doc.issueDate }],
      IssueTime: [{ _: doc.issueTime }],
      InvoiceTypeCode: [{ _: '01', listVersionID: '1.0' }],
      DocumentCurrencyCode: [{ _: 'MYR' }],
      InvoicePeriod: [{ StartDate: [{ _: doc.issueDate }], EndDate: [{ _: doc.issueDate }] }],
      AccountingSupplierParty: [{
        Party: [{
          PartyLegalEntity: [{ RegistrationName: [{ _: doc.sellerName }] }],
          PartyTaxScheme: [{ TaxScheme: [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153', schemeAgencyID: '6' }] }], CompanyID: [{ _: doc.sellerTin, schemeID: 'NRIC' }] }],
        }],
      }],
      AccountingCustomerParty: [{
        Party: [{
          PartyLegalEntity: [{ RegistrationName: [{ _: doc.buyerName }] }],
          PartyTaxScheme: [{ TaxScheme: [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153', schemeAgencyID: '6' }] }], CompanyID: [{ _: doc.buyerTin, schemeID: doc.buyerIdType }] }],
          Contact: [{ ElectronicMail: [{ _: doc.buyerEmail }] }],
          PostalAddress: [{ AddressLine: [{ Line: [{ _: doc.buyerAddress }] }], Country: [{ IdentificationCode: [{ _: 'MYS' }] }] }],
        }],
      }],
      TaxTotal: [{
        TaxAmount: [{ _: doc.taxAmount.toFixed(2), currencyID: 'MYR' }],
        TaxSubtotal: [{
          TaxableAmount: [{ _: doc.lineTotal.toFixed(2), currencyID: 'MYR' }],
          TaxAmount: [{ _: doc.taxAmount.toFixed(2), currencyID: 'MYR' }],
          TaxCategory: [{ ID: [{ _: '01' }], TaxScheme: [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153', schemeAgencyID: '6' }] }] }],
        }],
      }],
      LegalMonetaryTotal: [{
        LineExtensionAmount: [{ _: doc.lineTotal.toFixed(2), currencyID: 'MYR' }],
        TaxExclusiveAmount: [{ _: doc.lineTotal.toFixed(2), currencyID: 'MYR' }],
        TaxInclusiveAmount: [{ _: doc.grandTotal.toFixed(2), currencyID: 'MYR' }],
        PayableAmount: [{ _: doc.grandTotal.toFixed(2), currencyID: 'MYR' }],
      }],
      InvoiceLine: [{
        ID: [{ _: '1' }],
        InvoicedQuantity: [{ _: 1, unitCode: 'C62' }],
        LineExtensionAmount: [{ _: doc.lineTotal.toFixed(2), currencyID: 'MYR' }],
        Item: [{ Description: [{ _: 'F&B Sales' }], CommodityClassification: [{ ItemClassificationCode: [{ _: '013', listID: 'CLASS' }] }] }],
        Price: [{ PriceAmount: [{ _: doc.lineTotal.toFixed(2), currencyID: 'MYR' }] }],
        ItemPriceExtension: [{ Amount: [{ _: doc.lineTotal.toFixed(2), currencyID: 'MYR' }] }],
      }],
    }],
  };
}

export async function submitIndividualLive(
  creds: RestaurantCredentials,
  params: {
    receiptNo: string; sellerTin: string; sellerName: string;
    buyerTin: string; buyerName: string; buyerIdType: string; buyerIdNumber: string;
    buyerEmail: string; buyerAddress: string; lineTotal: number; taxAmount: number; grandTotal: number;
  }
) {
  const token = await getAccessToken(creds);
  const base = creds.mode === 'production' ? PROD_BASE : SANDBOX_BASE;
  const now = new Date();

  const document = buildUBLDocument({
    ...params,
    issueDate: now.toISOString().slice(0, 10),
    issueTime: now.toISOString().slice(11, 19) + 'Z',
  });

  const docStr = JSON.stringify(document);
  const docB64 = Buffer.from(docStr).toString('base64');
  const hash = await crypto.subtle.digest('SHA-256', Buffer.from(docStr));
  const hashB64 = Buffer.from(hash).toString('base64');

  const payload = {
    documents: [{
      format: 'JSON',
      document: docB64,
      documentHash: hashB64,
      codeNumber: params.receiptNo,
    }],
  };

  const res = await fetch(`${base}/api/v1.0/documentsubmissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json() as {
    submissionUID?: string;
    acceptedDocuments?: { uuid: string; invoiceCodeNumber: string }[];
    rejectedDocuments?: { invoiceCodeNumber: string; error: { message: string } }[];
  };

  if (!res.ok || !json.acceptedDocuments?.length) {
    const errMsg = json.rejectedDocuments?.[0]?.error?.message ?? `Submission failed (${res.status})`;
    return { ok: false, error: errMsg };
  }

  return { ok: true, documentId: json.acceptedDocuments[0].uuid, submissionId: json.submissionUID };
}
