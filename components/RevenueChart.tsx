'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type DataPoint = { month: string; revenue: number; sst: number };

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `RM${(v/1000).toFixed(0)}k`} width={52} />
        <Tooltip formatter={(v: unknown) => `RM ${(v as number).toFixed(2)}`} />
        <Bar dataKey="revenue" name="Revenue" fill="#111827" radius={[4,4,0,0]} />
        <Bar dataKey="sst" name="SST" fill="#6b7280" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
