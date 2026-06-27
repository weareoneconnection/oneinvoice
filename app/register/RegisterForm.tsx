'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    restaurantName: '', tin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        name: form.name,
        restaurantName: form.restaurantName,
        tin: form.tin,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push('/login?registered=1');
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex gap-2">
        {[1, 2].map(n => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${step >= n ? 'bg-slate-900' : 'bg-slate-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={nextStep} className="space-y-4">
          <h2 className="font-black">Your Account</h2>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Full Name</label>
            <input className="input" required value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ahmad bin Abdullah" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input className="input" type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="admin@restaurant.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input className="input" type="password" required value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Confirm Password</label>
            <input className="input" type="password" required value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Repeat password" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn w-full">Continue</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submit} className="space-y-4">
          <h2 className="font-black">Restaurant Details</h2>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Restaurant Name</label>
            <input className="input" required value={form.restaurantName} onChange={e => update('restaurantName', e.target.value)} placeholder="My Restaurant Sdn Bhd" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Taxpayer TIN (optional)</label>
            <input className="input" value={form.tin} onChange={e => update('tin', e.target.value)} placeholder="C1234567890 — can set later" />
          </div>
          <p className="text-xs text-slate-500">You'll start on the Free plan. Upgrade anytime in Billing Settings.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" className="btn-outline flex-1" onClick={() => setStep(1)}>Back</button>
            <button type="submit" className="btn flex-1" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
