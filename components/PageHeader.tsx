export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">OneInvoice AI</div>
      <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-slate-600">{subtitle}</p>
    </div>
  );
}
