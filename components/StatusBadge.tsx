import clsx from 'clsx';

export default function StatusBadge({ value }: { value: string }) {
  const cls = value.includes('failed') || value.includes('void')
    ? 'bg-rose-100 text-rose-700'
    : value.includes('validated') || value.includes('consolidated') || value.includes('individual')
      ? 'bg-emerald-100 text-emerald-700'
      : value.includes('pending') || value.includes('draft')
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-700';
  return <span className={clsx('badge', cls)}>{value.replaceAll('_', ' ')}</span>;
}
