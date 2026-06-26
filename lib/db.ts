import fs from 'fs';
import path from 'path';
import { ConsolidatedBatch, CustomerRequest, MyInvoisStatus, Receipt } from './types';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'db.json');

type Db = {
  receipts: Receipt[];
  requests: CustomerRequest[];
  consolidatedBatches: ConsolidatedBatch[];
  myInvois: MyInvoisStatus;
};

const defaultDb: Db = {
  receipts: [],
  requests: [],
  consolidatedBatches: [],
  myInvois: {
    mode: (process.env.MYINVOIS_MODE as 'sandbox' | 'production') || 'sandbox',
    apiConnection: 'mocked',
    taxpayerName: 'OneInvoice Demo Restaurant Sdn Bhd',
    taxpayerTin: 'C1234567890',
    lastSyncAt: new Date().toISOString()
  }
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
}

export function readDb(): Db {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8')) as Db;
}

export function writeDb(db: Db) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
}
