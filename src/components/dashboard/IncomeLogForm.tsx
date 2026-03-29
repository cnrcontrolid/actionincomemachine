"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DailyLog } from "@/types";

interface IncomeLogFormProps {
  goalId: string;
  logDate: string;
  existing: DailyLog | null;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function IncomeLogForm({ goalId, logDate, existing }: IncomeLogFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(logDate ?? todayStr());
  const [existingLog, setExistingLog] = useState<DailyLog | null>(existing);
  const [form, setForm] = useState({
    income_total: existing?.income_total?.toString() ?? "0",
    expenses: existing?.expenses?.toString() ?? "0",
    money_in_bank: existing?.money_in_bank?.toString() ?? "0",
    posts_count: existing?.posts_count?.toString() ?? "0",
    sales_calls_count: existing?.sales_calls_count?.toString() ?? "0",
    notes: existing?.notes ?? "",
  });

  // When date changes, fetch existing log for that date
  useEffect(() => {
    if (selectedDate === logDate) {
      // Use the server-provided existing log
      setExistingLog(existing);
      setForm({
        income_total: existing?.income_total?.toString() ?? "0",
        expenses: existing?.expenses?.toString() ?? "0",
        money_in_bank: existing?.money_in_bank?.toString() ?? "0",
        posts_count: existing?.posts_count?.toString() ?? "0",
        sales_calls_count: existing?.sales_calls_count?.toString() ?? "0",
        notes: existing?.notes ?? "",
      });
      return;
    }

    const controller = new AbortController();

    // Fetch log for other dates
    async function fetchLog() {
      const res = await fetch(`/api/daily-log?goal_id=${goalId}&log_date=${selectedDate}`, {
        signal: controller.signal,
      });
      if (!res.ok) return;
      const { data } = await res.json();
      setExistingLog(data ?? null);
      if (data) {
        setForm({
          income_total: data.income_total?.toString() ?? "0",
          expenses: data.expenses?.toString() ?? "0",
          money_in_bank: data.money_in_bank?.toString() ?? "0",
          posts_count: data.posts_count?.toString() ?? "0",
          sales_calls_count: data.sales_calls_count?.toString() ?? "0",
          notes: data.notes ?? "",
        });
      } else {
        setForm({ income_total: "0", expenses: "0", money_in_bank: "0", posts_count: "0", sales_calls_count: "0", notes: "" });
      }
    }
    fetchLog();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, goalId, logDate, existing?.id]);

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal_id: goalId,
        log_date: selectedDate,
        income_total: parseFloat(form.income_total) || 0,
        expenses: parseFloat(form.expenses) || 0,
        money_in_bank: parseFloat(form.money_in_bank) || 0,
        posts_count: parseInt(form.posts_count) || 0,
        sales_calls_count: parseInt(form.sales_calls_count) || 0,
        notes: form.notes,
      }),
    });

    setSaving(false);
    if (!res.ok) return;
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  const isUpdating = !!existingLog;

  return (
    <div className="card">
      <h3 className="font-heading font-bold text-charcoal mb-4">Log Your Numbers</h3>

      {/* Date picker */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
        <input
          type="date"
          className="input"
          value={selectedDate}
          max={todayStr()}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        {isUpdating && (
          <p className="text-xs text-[#FFAA00] font-medium mt-1">
            Updating existing log for {selectedDate}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Income */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Income</label>
          <p className="text-xs text-gray-500 mb-1.5">New sales generated</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input pl-7"
              {...field("income_total")}
            />
          </div>
        </div>

        {/* Expenses */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Expenses</label>
          <p className="text-xs text-gray-500 mb-1.5">Business &amp; personal expenses</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input pl-7"
              {...field("expenses")}
            />
          </div>
        </div>

        {/* Money in Bank */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Money in Bank</label>
          <p className="text-xs text-gray-500 mb-1.5">Total bank balance today</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input pl-7"
              {...field("money_in_bank")}
            />
          </div>
        </div>

        {/* Marketing Posts */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Marketing Posts</label>
          <p className="text-xs text-gray-500 mb-1.5">Posts published today</p>
          <input
            type="number"
            min="0"
            className="input"
            {...field("posts_count")}
          />
        </div>

        {/* Sales Calls */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Sales Calls</label>
          <p className="text-xs text-gray-500 mb-1.5">Calls/meetings made today</p>
          <input
            type="number"
            min="0"
            className="input"
            {...field("sales_calls_count")}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Notes <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Anything notable today..."
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#FFAA00] hover:bg-[#e09900] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Log"}
        </button>

        {saved && (
          <p className="text-center text-sm text-[#30B33C] font-medium">Saved!</p>
        )}
      </form>
    </div>
  );
}
