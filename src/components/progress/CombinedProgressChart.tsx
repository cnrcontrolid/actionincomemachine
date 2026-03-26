"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { eachDayOfInterval, parseISO, format, isWithinInterval } from "date-fns";
import type { Goal, DailyLog, Profile } from "@/types";
import Link from "next/link";

interface StatBoxProps {
  label: string;
  value: string | number;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

interface CombinedProgressChartProps {
  goal: Goal | null;
  logs: DailyLog[];
  profile: Profile | null;
}

export default function CombinedProgressChart({ goal, logs, profile }: CombinedProgressChartProps) {
  // Stat boxes — always shown
  const totalPosts = logs.reduce((s, l) => s + (l.posts_count ?? 0), 0);
  const totalCalls = logs.reduce((s, l) => s + (l.sales_calls_count ?? 0), 0);

  const stats: StatBoxProps[] = [
    { label: "Total Marketing Posts", value: totalPosts },
    { label: "Total Sales Calls", value: totalCalls },
    { label: "Instagram Followers", value: profile?.instagram_followers ?? 0 },
    { label: "YouTube Subscribers", value: profile?.youtube_subscribers ?? 0 },
    { label: "Facebook Friends", value: profile?.facebook_friends ?? 0 },
    { label: "LinkedIn Connections", value: profile?.linkedin_connections ?? 0 },
  ];

  if (!goal) {
    return (
      <div className="card">
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <StatBox key={s.label} {...s} />
          ))}
        </div>

        <div className="relative rounded-2xl overflow-hidden">
          {/* Blurred placeholder chart */}
          <div className="h-[350px] bg-gradient-to-br from-gray-100 to-gray-200 blur-sm" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <p className="text-gray-700 font-semibold text-lg mb-2">
              Set your goals and targets first to start tracking your progress
            </p>
            <Link
              href="/goals"
              className="mt-3 bg-[#FFAA00] hover:bg-[#e09900] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Go to My Goals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Build chart data: one entry per day from start_date to end_date
  let chartData: { date: string; income: number; actions: number; pace: number }[] = [];

  try {
    const start = parseISO(goal.start_date);
    const end = parseISO(goal.end_date);
    const allDays = eachDayOfInterval({ start, end });
    const logMap = new Map(logs.map((l) => [l.log_date, l]));
    const dailyPace = goal.revenue_target / 90;

    // Build action completions map: count completed actions per date from logs
    // (We only have daily_logs here — actions completed per day is approximated by posts_count+sales_calls_count)
    chartData = allDays.map((day, idx) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const log = logMap.get(dateStr);
      const income = log
        ? (log.income_total > 0
            ? log.income_total
            : log.income_low + log.income_mid + log.income_high)
        : 0;
      const actions = log ? (log.posts_count ?? 0) + (log.sales_calls_count ?? 0) : 0;
      return {
        date: dateStr,
        income,
        actions,
        pace: Math.round(dailyPace * (idx + 1)),
      };
    });
  } catch {
    // Invalid dates — just show empty
  }

  // Only show week-interval ticks on X axis
  const xTicks = chartData
    .filter((_, i) => i % 7 === 0)
    .map((d) => d.date);

  return (
    <div className="card space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatBox key={s.label} {...s} />
        ))}
      </div>

      <div>
        <h3 className="font-heading font-bold text-gray-900 mb-4">Daily Income &amp; Actions</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={(v) => {
                try { return format(parseISO(v), "MMM d"); } catch { return v; }
              }}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#30B33C" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(value: number, name: string) => {
                if (name === "Daily Income") return [`$${value.toLocaleString()}`, name];
                if (name === "Pace Target") return [`$${value.toLocaleString()}`, name];
                return [value, name];
              }}
              labelFormatter={(label) => {
                try { return format(parseISO(label as string), "MMM d, yyyy"); } catch { return label; }
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="income"
              name="Daily Income"
              fill="#FFAA00"
              radius={[3, 3, 0, 0]}
              maxBarSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="actions"
              name="Actions Done"
              stroke="#30B33C"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="pace"
              name="Pace Target"
              stroke="#d1d5db"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
