'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Restaurant = {
  id: string;
  name: string;
  tin: string;
  myInvoisMode: string;
  myInvoisClientId: string;
  myInvoisClientSecret: string;
} | null;

export default function RestaurantSettingsClient({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const isNew = !restaurant;
  const [form, setForm] = useState({
    name: restaurant?.name ?? '',
    tin: restaurant?.tin ?? '',
    mode: restaurant?.myInvoisMode ?? 'sandbox',
    clientId: restaurant?.myInvoisClientId ?? '',
    clientSecret: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    if (isNew) {
      const res = await fetch('/api/restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, tin: form.tin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.refresh();
    }

    // Update MyInvois credentials
    const res = await fetch('/api/myinvois/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        tin: form.tin,
        mode: form.mode,
        clientId: form.clientId,
        ...(form.clientSecret ? { clientSecret: form.clientSecret } : {}),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {isNew && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your account is not linked to a restaurant yet. Fill in your restaurant details to get started.
        </div>
      )}
      <form onSubmit={save} className="card p-6 space-y-5">
        <h2 className="font-black">Restaurant Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Restaurant Name</label>
            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="My Restaurant Sdn Bhd" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Taxpayer TIN</label>
            <input className="input" value={form.tin} onChange={(e) => update('tin', e.target.value)} required placeholder="C1234567890" />
          </div>
        </div>

        <hr className="border-slate-100" />
        <h2 className="font-black">MyInvois API Credentials</h2>
        <p className="text-sm text-slate-500">Get these from the LHDN MyInvois developer portal after registering your company. Leave blank to continue in sandbox mock mode.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Mode</label>
            <select className="input" value={form.mode} onChange={(e) => update('mode', e.target.value)}>
              <option value="sandbox">Sandbox (Mock)</option>
              <option value="production">Production (Live)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Client ID</label>
            <input className="input" value={form.clientId} onChange={(e) => update('clientId', e.target.value)} placeholder="From LHDN portal" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Client Secret</label>
            <input className="input" type="password" value={form.clientSecret} onChange={(e) => update('clientSecret', e.target.value)} placeholder="Leave blank to keep existing" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Settings saved successfully.</p>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Saving…' : isNew ? 'Create Restaurant & Continue' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
