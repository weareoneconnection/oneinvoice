'use client';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Send } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Send size={24} />
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight">OneInvoice AI</div>
            <div className="text-sm text-slate-500">Malaysia F&B e-Invoice Platform</div>
          </div>
        </div>
        <div className="card p-8">
          <h1 className="mb-6 text-xl font-black">Sign in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {registered && (
            <p className="mt-4 text-center text-sm text-green-600 font-semibold">Account created! Sign in below.</p>
          )}
          <p className="mt-4 text-center text-xs text-slate-400">Demo: admin@demo.com / demo1234</p>
          <p className="mt-3 text-center text-sm text-slate-500">
            No account?{' '}
            <Link href="/register" className="font-semibold text-slate-900 underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
