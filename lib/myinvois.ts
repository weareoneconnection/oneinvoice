import { ConsolidatedBatch, CustomerRequest } from './types';
import { validateTinLive, submitIndividualLive } from './myinvois-api';

export type MyInvoisAdapter = {
  validateTin(tin: string, idNumber: string, idType?: string): Promise<{ ok: boolean; error?: string }>;
  submitIndividualEInvoice(request: CustomerRequest, restaurantName?: string, restaurantTin?: string): Promise<{ ok: boolean; documentId?: string; error?: string; status?: string }>;
  submitConsolidatedEInvoice(batch: ConsolidatedBatch): Promise<{ ok: boolean; submissionId?: string; error?: string; status?: string }>;
};

export type RestaurantCredentials = {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'production';
};

function wait(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

const mockAdapter: MyInvoisAdapter = {
  async validateTin(tin, idNumber) {
    await wait(200);
    if (!tin || tin.length < 6) return { ok: false, error: 'TIN is missing or too short.' };
    if (!idNumber || idNumber.length < 4) return { ok: false, error: 'ID/BRN number is missing or too short.' };
    return { ok: true };
  },
  async submitIndividualEInvoice(request) {
    await wait(350);
    const tinCheck = await mockAdapter.validateTin(request.tin, request.idNumber);
    if (!tinCheck.ok) return { ok: false, error: tinCheck.error };
    return {
      ok: true,
      documentId: `MYINV-${new Date().getFullYear()}-${request.id.slice(-8).toUpperCase()}`,
      status: 'validated'
    };
  },
  async submitConsolidatedEInvoice(batch) {
    await wait(350);
    if (batch.receiptCount === 0) return { ok: false, error: 'No eligible receipts for consolidated e-Invoice.' };
    return {
      ok: true,
      submissionId: `SUB-${batch.month.replace('-', '')}-${batch.id.slice(-6).toUpperCase()}`,
      status: 'validated'
    };
  }
};

function makeLiveAdapter(creds: RestaurantCredentials): MyInvoisAdapter {
  return {
    async validateTin(tin, idNumber, idType = 'NRIC') {
      try {
        return await validateTinLive(creds, tin, idType, idNumber);
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },
    async submitIndividualEInvoice(request, restaurantName = '', restaurantTin = '') {
      try {
        const result = await submitIndividualLive(creds, {
          receiptNo: request.receiptNo,
          sellerTin: restaurantTin,
          sellerName: restaurantName,
          buyerTin: request.tin,
          buyerName: request.name,
          buyerIdType: request.idType,
          buyerIdNumber: request.idNumber,
          buyerEmail: request.email,
          buyerAddress: request.address,
          lineTotal: 0,      // caller should pass receipt amounts; using 0 as placeholder
          taxAmount: 0,
          grandTotal: 0,
        });
        return { ...result, status: result.ok ? 'validated' : 'failed' };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },
    async submitConsolidatedEInvoice(batch) {
      // Consolidated e-Invoice uses same submission endpoint with type '02'
      // For now fall back to mock until consolidated UBL builder is complete
      return mockAdapter.submitConsolidatedEInvoice(batch);
    }
  };
}

export function getMyInvoisAdapter(creds?: RestaurantCredentials | null): MyInvoisAdapter {
  if (creds?.clientId && creds?.clientSecret) {
    return makeLiveAdapter(creds);
  }
  return mockAdapter;
}
