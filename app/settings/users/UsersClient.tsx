'use client';
import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';

type User = { id: string; email: string; name: string | null; createdAt: string };

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setUsers((prev) => [...prev, data]);
    setForm({ name: '', email: '', password: '' });
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-base font-black">Add Staff Account</h2>
        <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Staff Name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="staff@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Min 8 characters" />
          </div>
          {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
          <div className="col-span-3">
            <button type="submit" className="btn flex items-center gap-2" disabled={loading}>
              <UserPlus size={15} /> {loading ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-semibold">{u.name ?? '—'}</td>
                <td>{u.email}</td>
                <td className="text-slate-400">{u.createdAt.slice(0, 10)}</td>
                <td className="pr-3 text-right">
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete user"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
