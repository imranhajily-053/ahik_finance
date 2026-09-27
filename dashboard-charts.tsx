"use client";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import { formatAzn } from "@/lib/format";

const COLORS = ["#2c4a7d", "#3a5f9c", "#5c7fb8", "#89a2cf", "#b0c1df", "#1f7a4d", "#b3261e"];

export function TrendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c4a7d" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2c4a7d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ec" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => new Intl.NumberFormat("az-AZ").format(v)} />
        <Tooltip formatter={(v: number) => formatAzn(v)} />
        <Area type="monotone" dataKey="total" stroke="#2c4a7d" fill="url(#trendFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({ data }: { data: { purpose: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="purpose" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatAzn(v)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function OrgBarChart({ data }: { data: { organization: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ec" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => new Intl.NumberFormat("az-AZ").format(v)} />
        <YAxis type="category" dataKey="organization" width={220} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => formatAzn(v)} />
        <Bar dataKey="total" fill="#2c4a7d" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
