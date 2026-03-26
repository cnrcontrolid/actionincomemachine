"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  actual: number;
  pace: number;
}

export default function RevenueLineChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-warmgray text-sm">
        No data yet. Start logging your daily numbers.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5DBC5" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B6560" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6B6560" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
          contentStyle={{ borderRadius: 12, border: "1px solid #F5DBC5", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual revenue"
          stroke="#C2692A"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="pace"
          name="Target pace"
          stroke="#F5DBC5"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
