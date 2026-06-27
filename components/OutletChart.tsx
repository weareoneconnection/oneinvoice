'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, type PieLabelRenderProps } from 'recharts';

const COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db'];

type DataPoint = { outlet: string; total: number };

export default function OutletChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="outlet" cx="50%" cy="50%" outerRadius={80} label={(p: PieLabelRenderProps) => `${p.name ?? ''} ${((p.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_: DataPoint, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: unknown) => `RM ${(v as number).toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
