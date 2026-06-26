import { ConsolidatedBatch, CustomerRequest } from './types';

export type MyInvoisAdapter = {
  validateTin(tin: string, idNumber: string): Promise<{ ok: boolean; error?: string }>;
  submitIndividualEInvoice(request: CustomerRequest): Promise<{ ok: boolean; documentId?: string; error?: string; status?: string }>;
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

function makeProductionAdapter(_creds: RestaurantCredentials): MyInvoisAdapter {
  // TODO: implement real LHDN MyInvois OAuth 2.0 + REST API calls using creds
  return {
    async validateTin() {
      throw new Error('Production MyInvois adapter not yet implemented.');
    },
    async submitIndividualEInvoice() {
      throw new Error('Production MyInvois adapter not yet implemented.');
    },
    async submitConsolidatedEInvoice() {
      throw new Error('Production MyInvois adapter not yet implemented.');
    }
  };
}

export function getMyInvoisAdapter(creds?: RestaurantCredentials | null): MyInvoisAdapter {
  if (creds?.mode === 'production' && creds.clientId && creds.clientSecret) {
    return makeProductionAdapter(creds);
  }
  return mockAdapter;
}
