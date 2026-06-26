'use client';
import { useState } from 'react';

export default function RequestForm({ receiptId, receiptNo }: { receiptId: string; receiptNo: string }) {
  const [result, setResult] = useState('');
  async function submit(formData: FormData) {
    setResult('Submitting to MyInvois sandbox...');
    const body = Object.fromEntries(formData.entries());
    const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    setResult(res.ok ? `Status: ${json.status}. Document ID: ${json.myInvoisDocumentId || 'N/A'} ${json.error || ''}` : json.error);
  }
  return (
    <form action={submit} className="card mx-auto max-w-2xl p-6">
      <input type="hidden" name="receiptId" value={receiptId} />
      <input type="hidden" name="receiptNo" value={receiptNo} />
      <h1 className="text-2xl font-black">Request e-Invoice</h1>
      <p className="mt-1 text-sm text-slate-500">Receipt: {receiptNo}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block"><span className="label">Customer Type</span><select className="input mt-1" name="customerType"><option value="individual">Individual</option><option value="company">Company</option></select></label>
        <label className="block"><span className="label">Name / Company Name</span><input className="input mt-1" name="name" required /></label>
        <label className="block"><span className="label">TIN</span><input className="input mt-1" name="tin" placeholder="e.g. C1234567890" required /></label>
        <label className="block"><span className="label">ID Type</span><select className="input mt-1" name="idType"><option>NRIC</option><option>PASSPORT</option><option>BRN</option></select></label>
        <label className="block"><span className="label">ID / BRN Number</span><input className="input mt-1" name="idNumber" required /></label>
        <label className="block"><span className="label">Email</span><input className="input mt-1" type="email" name="email" required /></label>
        <label className="block md:col-span-2"><span className="label">Address</span><input className="input mt-1" name="address" required /></label>
        <label className="block md:col-span-2"><span className="label">Phone</span><input className="input mt-1" name="phone" /></label>
      </div>
      <button className="btn mt-5" type="submit">Submit e-Invoice Request</button>
      {result && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{result}</div>}
    </form>
  );
}
