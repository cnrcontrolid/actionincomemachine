"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Pencil, Check, X, Plus } from "lucide-react";
import type { DailyLog, Goal } from "@/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface EditRow {
  income_total: string;
  expenses: string;
  money_in_bank: string;
  posts_count: string;
  sales_calls_count: string;
  notes: string;
}

export default function LogHistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [editForm, setEditForm] = useState<EditRow>({
    income_total: "0",
    expenses: "0",
    money_in_bank: "0",
    posts_count: "0",
    sales_calls_count: "0",
    notes: "",
  });
  const [newDate, setNewDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get active goal
    const { data: goal } = await supabase
      .from("goals")
      .select("id")
      .eq("client_id", user.id)
      .eq("status", "active")
      .single() as { data: Goal | null };
    if (goal) setGoalId(goal.id);

    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("client_id", user.id)
      .order("log_date", { ascending: false }) as { data: DailyLog[] | null };

    setLogs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function startEdit(log: DailyLog) {
    setEditingId(log.id);
    setEditForm({
      income_total: (log.income_total ?? 0).toString(),
      expenses: (log.expenses ?? 0).toString(),
      money_in_bank: (log.money_in_bank ?? 0).toString(),
      posts_count: (log.posts_count ?? 0).toString(),
      sales_calls_count: (log.sales_calls_count ?? 0).toString(),
      notes: log.notes ?? "",
    });
  }

  function startNew() {
    setEditingId("new");
    setNewDate(todayStr());
    setEditForm({ income_total: "0", expenses: "0", money_in_bank: "0", posts_count: "0", sales_calls_count: "0", notes: "" });
  }

  async function saveEdit(logId: string) {
    setSaving(true);
    await fetch(`/api/daily-log/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        income_total: parseFloat(editForm.income_total) || 0,
        expenses: parseFloat(editForm.expenses) || 0,
        money_in_bank: parseFloat(editForm.money_in_bank) || 0,
        posts_count: parseInt(editForm.posts_count) || 0,
        sales_calls_count: parseInt(editForm.sales_calls_count) || 0,
        notes: editForm.notes,
      }),
    });
    setSaving(false);
    setEditingId(null);
    fetchLogs();
  }

  async function saveNew() {
    if (!goalId) return;
    setSaving(true);
    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal_id: goalId,
        log_date: newDate,
        income_total: parseFloat(editForm.income_total) || 0,
        expenses: parseFloat(editForm.expenses) || 0,
        money_in_bank: parseFloat(editForm.money_in_bank) || 0,
        posts_count: parseInt(editForm.posts_count) || 0,
        sales_calls_count: parseInt(editForm.sales_calls_count) || 0,
        notes: editForm.notes,
      }),
    });
    setSaving(false);
    setEditingId(null);
    fetchLogs();
  }

  function ef(key: keyof EditRow) {
    return {
      value: editForm[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditForm((p) => ({ ...p, [key]: e.target.value })),
      className: "w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00]",
    };
  }

  const displayed = filterDate
    ? logs.filter((l) => l.log_date === filterDate)
    : logs;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 text-center text-warmgray">Loading…</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading font-bold text-3xl text-charcoal">Log History</h1>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mr-2">Filter by date</label>
            <input
              type="date"
              value={filterDate}
              max={todayStr()}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00]"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="ml-2 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 bg-[#FFAA00] hover:bg-[#e69900] text-black text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Add Entry
          </button>
        </div>
      </div>

      {/* Add new entry form */}
      {editingId === "new" && (
        <div className="bg-white border border-[#FFAA00] rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">New Log Entry</h3>
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Date</label>
            <input
              type="date"
              value={newDate}
              max={todayStr()}
              onChange={(e) => setNewDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00]"
            />
          </div>
          <InlineEditFields ef={ef} />
          <div className="flex gap-2 mt-3">
            <button
              onClick={saveNew}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#FFAA00] hover:bg-[#e69900] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <Check size={14} /> {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-warmgray">
            {filterDate ? `No log found for ${filterDate}.` : "No logs yet. Start logging from your dashboard."}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Date", "Income", "Expenses", "Money in Bank", "Posts", "Sales Calls", "Notes", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((log) => {
                const isEditing = editingId === log.id;
                return (
                  <tr key={log.id} className={isEditing ? "bg-amber-50" : "hover:bg-gray-50/50 transition-colors"}>
                    <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">
                      {format(new Date(log.log_date + "T00:00:00"), "dd MMM yyyy")}
                    </td>
                    {isEditing ? (
                      <>
                        <td className="px-2 py-2"><input type="number" min="0" step="0.01" {...ef("income_total")} /></td>
                        <td className="px-2 py-2"><input type="number" min="0" step="0.01" {...ef("expenses")} /></td>
                        <td className="px-2 py-2"><input type="number" min="0" step="0.01" {...ef("money_in_bank")} /></td>
                        <td className="px-2 py-2"><input type="number" min="0" {...ef("posts_count")} /></td>
                        <td className="px-2 py-2"><input type="number" min="0" {...ef("sales_calls_count")} /></td>
                        <td className="px-2 py-2"><input type="text" {...ef("notes")} placeholder="Notes…" /></td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex gap-1">
                            <button
                              onClick={() => saveEdit(log.id)}
                              disabled={saving}
                              className="bg-[#FFAA00] text-black text-xs font-semibold px-2 py-1 rounded-lg hover:bg-[#e69900] disabled:opacity-60"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="border border-gray-200 text-gray-500 text-xs px-2 py-1 rounded-lg hover:bg-gray-100"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-[#30B33C] font-semibold">${(log.income_total ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-red-500">${(log.expenses ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-charcoal">${(log.money_in_bank ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-charcoal">{log.posts_count ?? 0}</td>
                        <td className="px-4 py-3 text-charcoal">{log.sales_calls_count ?? 0}</td>
                        <td className="px-4 py-3 text-warmgray max-w-xs truncate">{log.notes ?? "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => startEdit(log)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#FFAA00] transition-colors"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InlineEditFields({ ef }: { ef: (key: keyof EditRow) => { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; className: string } }) {
  const fields = [
    { key: "income_total", label: "Income ($)", type: "number" },
    { key: "expenses", label: "Expenses ($)", type: "number" },
    { key: "money_in_bank", label: "Money in Bank ($)", type: "number" },
    { key: "posts_count", label: "Marketing Posts", type: "number" },
    { key: "sales_calls_count", label: "Sales Calls", type: "number" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {fields.map(({ key, label, type }) => (
        <div key={key}>
          <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
          <input type={type} min="0" {...ef(key as keyof EditRow)} />
        </div>
      ))}
      <div className="col-span-2 sm:col-span-3">
        <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
        <input type="text" {...ef("notes")} placeholder="Optional notes…" />
      </div>
    </div>
  );
}
