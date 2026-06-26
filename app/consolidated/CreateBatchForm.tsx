'use client';
import { useState } from 'react';

export default function CreateBatchForm({ outlets }: { outlets: string[] }) {
  const [msg, setMsg] = useState('');
  async function submit(formData: FormData) {
    const body = Object.fromEntries(formData.entries());
    setMsg('Generating consolidated e-Invoice...');
    const res = await fetch('/api/consolidated', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, submit: body.submit === 'on' }) });
    const json = await res.json();
    setMsg(res.ok ? `Batch ${json.id} created. Status: ${json.status}. Receipts: ${json.receiptCount}. Amount: RM ${json.amount.toFixed(2)}` : json.error);
  }
  const month = new Date().toISOString().slice(0, 7);
  return (
    <form action={submit} className="card p-5">
      <h2 className="text-lg font-black">Create Consolidated e-Invoice</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <label><span className="label">Month</span><input className="input mt-1" type="month" name="month" defaultValue={month} /></label>
        <label><span className="label">Outlet</span><select className="input mt-1" name="outlet"><option value="ALL">ALL</option>{outlets.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
        <label className="flex items-end gap-2 pb-2"><input type="checkbox" name="submit" defaultChecked /> <span className="text-sm font-semibold">Submit to sandbox</span></label>
        <div className="flex items-end"><button className="btn w-full" type="submit">Generate Batch</button></div>
      </div>
      {msg && <p className="mt-3 text-sm font-semibold text-slate-700">{msg}</p>}
    </form>
  );
}
