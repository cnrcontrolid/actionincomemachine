"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import type { DailyLog, Goal } from "@/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface LogForm {
  income_total: string;
  expenses: string;
  money_in_bank: string;
  posts_count: string;
  sales_calls_count: string;
  instagram_followers: string;
  youtube_subscribers: string;
  facebook_friends: string;
  linkedin_connections: string;
  notes: string;
}

const defaultForm: LogForm = {
  income_total: "0",
  expenses: "0",
  money_in_bank: "0",
  posts_count: "0",
  sales_calls_count: "0",
  instagram_followers: "0",
  youtube_subscribers: "0",
  facebook_friends: "0",
  linkedin_connections: "0",
  notes: "",
};

export default function IncomePage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  // Quick log form (top section)
  const [quickDate, setQuickDate] = useState(todayStr());
  const [quickForm, setQuickForm] = useState<LogForm>(defaultForm);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSaved, setQuickSaved] = useState(false);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LogForm>(defaultForm);
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
      .order("log_date", { ascending: false })
      .limit(90) as { data: DailyLog[] | null };

    setLogs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Quick log ────────────────────────────────────────────────────────────

  async function saveQuickLog(e: React.FormEvent) {
    e.preventDefault();
    if (!goalId) return;
    setQuickSaving(true);
    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal_id: goalId,
        log_date: quickDate,
        income_total: parseFloat(quickForm.income_total) || 0,
        expenses: parseFloat(quickForm.expenses) || 0,
        money_in_bank: parseFloat(quickForm.money_in_bank) || 0,
        posts_count: parseInt(quickForm.posts_count) || 0,
        sales_calls_count: parseInt(quickForm.sales_calls_count) || 0,
        instagram_followers: parseInt(quickForm.instagram_followers) || 0,
        youtube_subscribers: parseInt(quickForm.youtube_subscribers) || 0,
        facebook_friends: parseInt(quickForm.facebook_friends) || 0,
        linkedin_connections: parseInt(quickForm.linkedin_connections) || 0,
        notes: quickForm.notes,
      }),
    });
    setQuickSaving(false);
    setQuickSaved(true);
    setQuickForm(defaultForm);
    setTimeout(() => setQuickSaved(false), 2500);
    fetchLogs();
  }

  // ── Inline edit ──────────────────────────────────────────────────────────

  function startEdit(log: DailyLog) {
    setEditingId(log.id);
    setEditForm({
      income_total: (log.income_total ?? 0).toString(),
      expenses: (log.expenses ?? 0).toString(),
      money_in_bank: (log.money_in_bank ?? 0).toString(),
      posts_count: (log.posts_count ?? 0).toString(),
      sales_calls_count: (log.sales_calls_count ?? 0).toString(),
      instagram_followers: (log.instagram_followers ?? 0).toString(),
      youtube_subscribers: (log.youtube_subscribers ?? 0).toString(),
      facebook_friends: (log.facebook_friends ?? 0).toString(),
      linkedin_connections: (log.linkedin_connections ?? 0).toString(),
      notes: log.notes ?? "",
    });
  }

  async function saveEdit(logId: string) {
    setEditSaving(true);
    await fetch(`/api/daily-log/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        income_total: parseFloat(editForm.income_total) || 0,
        expenses: parseFloat(editForm.expenses) || 0,
        money_in_bank: parseFloat(editForm.money_in_bank) || 0,
        posts_count: parseInt(editForm.posts_count) || 0,
        sales_calls_count: parseInt(editForm.sales_calls_count) || 0,
        instagram_followers: parseInt(editForm.instagram_followers) || 0,
        youtube_subscribers: parseInt(editForm.youtube_subscribers) || 0,
        facebook_friends: parseInt(editForm.facebook_friends) || 0,
        linkedin_connections: parseInt(editForm.linkedin_connections) || 0,
        notes: editForm.notes,
      }),
    });
    setEditSaving(false);
    setEditingId(null);
    fetchLogs();
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function deleteLog(logId: string) {
    setDeletingId(logId);
    await fetch(`/api/daily-log/${logId}`, { method: "DELETE" });
    setDeletingId(null);
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  // ── Edit input helper ────────────────────────────────────────────────────

  function ei(key: keyof LogForm, type: "number" | "text" = "number") {
    return {
      value: editForm[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditForm((p) => ({ ...p, [key]: e.target.value })),
      className: "w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FFAA00]",
      type,
      ...(type === "number" ? { min: "0" } : {}),
    };
  }

  const displayed = useMemo(
    () => filterDate ? logs.filter((l) => l.log_date === filterDate) : logs,
    [logs, filterDate]
  );

  if (loading) {
    return <div className="max-w-5xl mx-auto py-10 text-center text-warmgray">Loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">Income</h1>

      {/* ── Log Your Numbers ─────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="font-heading font-bold text-charcoal text-lg">Log Your Numbers</h2>
        <form onSubmit={saveQuickLog} className="space-y-3">
          {/* Row 1 — income / activity */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={quickDate}
                max={todayStr()}
                onChange={(e) => setQuickDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00]"
              />
            </div>
            {[
              { key: "income_total", label: "Income ($)", step: "0.01" },
              { key: "expenses", label: "Expenses ($)", step: "0.01" },
              { key: "money_in_bank", label: "Money in Bank ($)", step: "0.01" },
              { key: "posts_count", label: "Posts", step: "1" },
              { key: "sales_calls_count", label: "Sales Calls", step: "1" },
            ].map(({ key, label, step }) => (
              <div key={key} className="flex flex-col gap-1 min-w-[100px] flex-1">
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="number"
                  min="0"
                  step={step}
                  value={quickForm[key as keyof LogForm]}
                  onChange={(e) => setQuickForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00]"
                />
              </div>
            ))}
          </div>

          {/* Row 2 — follower counts */}
          <div className="flex flex-wrap gap-3 items-end border-t border-gray-100 pt-3">
            {[
              { key: "instagram_followers", label: "Instagram Followers" },
              { key: "youtube_subscribers", label: "YouTube Subscribers" },
              { key: "facebook_friends", label: "Facebook Friends" },
              { key: "linkedin_connections", label: "LinkedIn Connections" },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1 min-w-[140px] flex-1">
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quickForm[key as keyof LogForm]}
                  onChange={(e) => setQuickForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00]"
                />
              </div>
            ))}
          </div>

          {/* Notes + Save */}
          <div className="flex gap-3 items-end border-t border-gray-100 pt-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Notes (optional)</label>
              <textarea
                value={quickForm.notes}
                onChange={(e) => setQuickForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes for today…"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00] resize-y"
              />
            </div>
            <button
              type="submit"
              disabled={quickSaving || !goalId}
              className="flex items-center gap-1.5 bg-[#FFAA00] hover:bg-[#e69900] text-black text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 self-end mb-0.5"
            >
              {quickSaving ? "Saving…" : quickSaved ? "Saved!" : "Save"}
            </button>
          </div>
        </form>
        {!goalId && <p className="text-xs text-warmgray">No active goal — logging disabled until your coach sets your goal.</p>}
      </div>

      {/* ── Log History Table ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-heading font-bold text-xl text-charcoal">Log History</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Filter by date</label>
            <input
              type="date"
              value={filterDate}
              max={todayStr()}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFAA00]"
            />
            {filterDate && (
              <button onClick={() => setFilterDate("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            )}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-warmgray">
              {filterDate ? `No log found for ${filterDate}.` : "No logs yet. Use the form above to log your first entry."}
            </p>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    { label: "Date", title: "Date" },
                    { label: "Income", title: "Income" },
                    { label: "Exp.", title: "Expenses" },
                    { label: "Bank", title: "Money in Bank" },
                    { label: "Posts", title: "Posts" },
                    { label: "Calls", title: "Sales Calls" },
                    { label: "IG", title: "Instagram Followers" },
                    { label: "YT", title: "YouTube Subscribers" },
                    { label: "FB", title: "Facebook Friends" },
                    { label: "LI", title: "LinkedIn Connections" },
                    { label: "", title: "" },
                  ].map((h, i) => (
                    <th key={i} title={h.title} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((log) => {
                  const isEditing = editingId === log.id;
                  const isDeleting = deletingId === log.id;
                  return (
                    <tr key={log.id} className={isEditing ? "bg-amber-50" : "hover:bg-gray-50/50 transition-colors"}>
                      <td className="px-3 py-3 font-medium text-charcoal whitespace-nowrap text-xs">
                        {format(new Date(log.log_date + "T00:00:00"), "dd MMM yy")}
                      </td>
                      {isEditing ? (
                        <>
                          <td className="px-2 py-2"><input {...ei("income_total")} step="0.01" /></td>
                          <td className="px-2 py-2"><input {...ei("expenses")} step="0.01" /></td>
                          <td className="px-2 py-2"><input {...ei("money_in_bank")} step="0.01" /></td>
                          <td className="px-2 py-2"><input {...ei("posts_count")} /></td>
                          <td className="px-2 py-2"><input {...ei("sales_calls_count")} /></td>
                          <td className="px-2 py-2"><input {...ei("instagram_followers")} /></td>
                          <td className="px-2 py-2"><input {...ei("youtube_subscribers")} /></td>
                          <td className="px-2 py-2"><input {...ei("facebook_friends")} /></td>
                          <td className="px-2 py-2 min-w-[180px]">
                            <div className="space-y-1">
                              <input {...ei("linkedin_connections")} />
                              <textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                                placeholder="Notes…"
                                rows={2}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FFAA00] resize-y"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="flex gap-1">
                              <button onClick={() => saveEdit(log.id)} disabled={editSaving} className="bg-[#FFAA00] text-black text-xs font-semibold p-1.5 rounded-lg hover:bg-[#e69900] disabled:opacity-60">
                                <Check size={12} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="border border-gray-200 text-gray-500 text-xs p-1.5 rounded-lg hover:bg-gray-100">
                                <X size={12} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-3 text-[#30B33C] font-semibold text-xs">${(log.income_total ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-red-500 text-xs">${(log.expenses ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-charcoal text-xs">${(log.money_in_bank ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-charcoal text-xs">{log.posts_count ?? 0}</td>
                          <td className="px-3 py-3 text-charcoal text-xs">{log.sales_calls_count ?? 0}</td>
                          <td className="px-3 py-3 text-charcoal text-xs">{(log.instagram_followers ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-charcoal text-xs">{(log.youtube_subscribers ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-charcoal text-xs">{(log.facebook_friends ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-3 text-charcoal text-xs">{(log.linkedin_connections ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => startEdit(log)} className="text-gray-400 hover:text-[#FFAA00] transition-colors" title="Edit">
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => { if (window.confirm("Delete this log entry?")) deleteLog(log.id); }}
                                disabled={isDeleting}
                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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
    </div>
  );
}
