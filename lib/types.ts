export type ReceiptStatus = 'normal' | 'individual_einvoice' | 'consolidated' | 'void' | 'refund';
export type RequestStatus = 'pending' | 'submitted' | 'validated' | 'failed';

export type ReceiptItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type Receipt = {
  id: string;
  receiptNo: string;
  outlet: string;
  channel: 'dine_in' | 'takeaway' | 'delivery' | 'online';
  date: string;
  subtotal: number;
  serviceCharge: number;
  sst: number;
  discount: number;
  rounding: number;
  total: number;
  status: ReceiptStatus;
  customerRequestId?: string;
  items: ReceiptItem[];
};

export type CustomerRequest = {
  id: string;
  receiptId: string;
  receiptNo: string;
  customerType: 'individual' | 'company';
  name: string;
  tin: string;
  idType: 'NRIC' | 'PASSPORT' | 'BRN';
  idNumber: string;
  email: string;
  phone?: string;
  address: string;
  status: RequestStatus;
  myInvoisDocumentId?: string;
  error?: string;
  createdAt: string;
};

export type ConsolidatedBatch = {
  id: string;
  month: string;
  outlet: string;
  receiptCount: number;
  amount: number;
  sst: number;
  status: 'draft' | 'submitted' | 'validated' | 'failed';
  receiptIds: string[];
  myInvoisSubmissionId?: string;
  createdAt: string;
};

export type MyInvoisStatus = {
  mode: 'sandbox' | 'production';
  apiConnection: 'connected' | 'mocked' | 'disconnected';
  taxpayerName: string;
  taxpayerTin: string;
  lastSyncAt: string;
};
