'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Bot, FileText, LayoutDashboard, LogOut, Receipt, ScanLine, Send, Settings, ShieldCheck } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/requests', label: 'Customer Requests', icon: ScanLine },
  { href: '/consolidated', label: 'Consolidated', icon: FileText },
  { href: '/myinvois', label: 'MyInvois Center', icon: ShieldCheck },
  { href: '/ai-accountant', label: 'AI Accountant', icon: Bot },
  { href: '/settings/restaurant', label: 'Restaurant Settings', icon: Settings },
  { href: '/settings/users', label: 'User Management', icon: Settings },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white"><Send size={20} /></div>
          <div>
            <div className="text-lg font-black tracking-tight">OneInvoice AI</div>
            <div className="text-xs text-slate-500">Malaysia F&B e-Invoice</div>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 space-y-3">
          {session?.user && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="truncate text-xs font-semibold text-slate-700">{session.user.name ?? session.user.email}</p>
              <p className="truncate text-xs text-slate-400">{session.user.email}</p>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            Powered by OneAI. Sandbox-first architecture for LHDN MyInvois integration.
          </div>
        </div>
      </aside>
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
