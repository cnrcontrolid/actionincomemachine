"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyLog } from "@/types";

export default function DailyIncomeBarChart({ logs }: { logs: DailyLog[] }) {
  const data = logs.map((l) => ({
    date: l.log_date.slice(5), // MM-DD
    Low: l.income_low,
    Mid: l.income_mid,
    High: l.income_high,
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5DBC5" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B6560" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6B6560" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
        <Tooltip
          formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
          contentStyle={{ borderRadius: 12, border: "1px solid #F5DBC5", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Low" fill="#F5DBC5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Mid" fill="#C2692A" radius={[4, 4, 0, 0]} />
        <Bar dataKey="High" fill="#1F1F1F" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
