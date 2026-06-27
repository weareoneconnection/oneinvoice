'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Bot, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Receipt, ScanLine, Send, Settings, ShieldCheck, X } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/requests', label: 'Customer Requests', icon: ScanLine },
  { href: '/consolidated', label: 'Consolidated', icon: FileText },
  { href: '/myinvois', label: 'MyInvois Center', icon: ShieldCheck },
  { href: '/ai-accountant', label: 'AI Accountant', icon: Bot },
  { href: '/settings/billing', label: 'Billing & Plan', icon: CreditCard },
  { href: '/settings/restaurant', label: 'Restaurant Settings', icon: Settings },
  { href: '/settings/users', label: 'User Management', icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const path = usePathname();
  return (
    <nav className="mt-8 space-y-1">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = path === item.href || path.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            <Icon size={18} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const userBlock = session?.user && (
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
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white"><Send size={20} /></div>
          <div>
            <div className="text-lg font-black tracking-tight">OneInvoice AI</div>
            <div className="text-xs text-slate-500">Malaysia F&B e-Invoice</div>
          </div>
        </Link>
        <NavLinks />
        <div className="mt-auto space-y-3 pt-6">
          {userBlock}
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            Sandbox-first LHDN MyInvois integration.
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white"><Send size={14} /></div>
          <span className="font-black tracking-tight">OneInvoice AI</span>
        </Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-slate-100">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-5 flex flex-col shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-black tracking-tight">OneInvoice AI</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <NavLinks onClick={() => setOpen(false)} />
            <div className="mt-auto space-y-3 pt-6">
              {userBlock}
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
