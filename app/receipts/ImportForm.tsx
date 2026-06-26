'use client';
import { useState } from 'react';

export default function ImportForm() {
  const [msg, setMsg] = useState('');
  async function submit(formData: FormData) {
    setMsg('Importing...');
    const res = await fetch('/api/receipts/import', { method: 'POST', body: formData });
    const json = await res.json();
    setMsg(res.ok ? `Imported ${json.imported}, skipped ${json.skipped}. Refresh page to view.` : json.error);
  }
  return (
    <form action={submit} className="card p-5">
      <h2 className="text-lg font-black">Import POS CSV</h2>
      <p className="mt-1 text-sm text-slate-500">Supported fields: receiptNo, outlet, channel, date, subtotal, serviceCharge, sst, discount, rounding, total.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input className="input" type="file" name="file" accept=".csv" required />
        <button className="btn" type="submit">Upload CSV</button>
      </div>
      {msg && <p className="mt-3 text-sm font-semibold text-slate-700">{msg}</p>}
    </form>
  );
}
