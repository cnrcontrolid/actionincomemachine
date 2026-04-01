"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Pencil, Check, X, Trash2, Calculator, ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { DailyLog, Goal, Product } from "@/types";

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

// Sales Calculator row labels and default %
const CALC_ROWS = [
  { key: "audience", label: "Audience / Reach", isBase: true },
  { key: "leads", label: "Leads generated", pct: 10 },
  { key: "applications", label: "Applications", pct: 30 },
  { key: "calls_booked", label: "Calls booked", pct: 70 },
  { key: "calls_done", label: "Calls completed", pct: 80 },
  { key: "proposals", label: "Proposals sent", pct: 80 },
  { key: "negotiations", label: "Negotiations", pct: 60 },
  { key: "sales", label: "Sales / Closed", pct: 50 },
];

export default function IncomePage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  // Quick log form
  const [quickDate, setQuickDate] = useState(todayStr());
  const [quickForm, setQuickForm] = useState<LogForm>(defaultForm);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSaved, setQuickSaved] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LogForm>(defaultForm);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sales calculator state
  const [calcAudience, setCalcAudience] = useState("1000");
  const [calcPcts, setCalcPcts] = useState<Record<string, number>>(() =>
    Object.fromEntries(CALC_ROWS.filter(r => !r.isBase).map(r => [r.key, r.pct!]))
  );
  const [calcProductId, setCalcProductId] = useState<string>("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [goalRes, logsRes, productsRes] = await Promise.all([
      supabase.from("goals").select("id").eq("client_id", user.id).eq("status", "active").single(),
      supabase.from("daily_logs").select("*").eq("client_id", user.id).order("log_date", { ascending: false }).limit(90),
      supabase.from("products").select("*").eq("client_id", user.id).eq("is_active", true),
    ]);

    if (goalRes.data) setGoalId((goalRes.data as { id: string }).id);
    setLogs((logsRes.data as DailyLog[] | null) ?? []);
    const prods = (productsRes.data as Product[] | null) ?? [];
    setProducts(prods);
    if (prods.length > 0 && !calcProductId) setCalcProductId(prods[0].id);
    setLoading(false);
  }, [calcProductId]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    fetchData();
  }

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
    fetchData();
  }

  async function deleteLog(logId: string) {
    setDeletingId(logId);
    await fetch(`/api/daily-log/${logId}`, { method: "DELETE" });
    setDeletingId(null);
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  function ei(key: keyof LogForm) {
    return {
      value: editForm[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditForm((p) => ({ ...p, [key]: e.target.value })),
      className: "w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FFAA00]/50",
    };
  }

  // Sales calculator logic
  const calcRows = useMemo(() => {
    const base = parseFloat(calcAudience) || 0;
    const rows: { key: string; label: string; value: number; pct?: number }[] = [];
    let current = base;
    for (const row of CALC_ROWS) {
      if (row.isBase) {
        rows.push({ key: row.key, label: row.label, value: base });
      } else {
        current = Math.round(current * (calcPcts[row.key] / 100));
        rows.push({ key: row.key, label: row.label, value: current, pct: calcPcts[row.key] });
      }
    }
    return rows;
  }, [calcAudience, calcPcts]);

  const selectedProduct = products.find((p) => p.id === calcProductId);
  const salesRow = calcRows.find((r) => r.key === "sales");
  const predictedMonthly = selectedProduct && salesRow ? Math.round(salesRow.value * selectedProduct.price) : 0;

  function adjustPct(key: string, delta: number) {
    setCalcPcts((prev) => ({ ...prev, [key]: Math.max(1, Math.min(100, (prev[key] ?? 10) + delta)) }));
  }

  const displayed = useMemo(
    () => filterDate ? logs.filter((l) => l.log_date === filterDate) : logs,
    [logs, filterDate]
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Log form ──────────────────────────────────────────── */}
      <div className="card shrink-0">
        <form onSubmit={saveQuickLog} className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="label">Date</label>
              <input
                type="date"
                value={quickDate}
                max={todayStr()}
                onChange={(e) => setQuickDate(e.target.value)}
                className="input w-auto"
              />
            </div>
            {([
              { key: "income_total", label: "Income ($)", step: "0.01" },
              { key: "expenses", label: "Expenses ($)", step: "0.01" },
              { key: "money_in_bank", label: "Bank ($)", step: "0.01" },
              { key: "posts_count", label: "Posts", step: "1" },
              { key: "sales_calls_count", label: "Calls", step: "1" },
            ] as { key: string; label: string; step: string }[]).map(({ key, label, step }) => (
              <div key={key} className="flex flex-col gap-1 min-w-[80px] flex-1">
                <label className="label">{label}</label>
                <input
                  type="number"
                  min="0"
                  step={step}
                  value={quickForm[key as keyof LogForm]}
                  onChange={(e) => setQuickForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="input"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setShowFollowers(v => !v)}
              className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-[7px] self-end border border-gray-200 rounded-lg transition-colors"
            >
              {showFollowers ? "− Followers" : "+ Followers"}
            </button>
            <button
              type="submit"
              disabled={quickSaving || !goalId}
              className="bg-[#FFAA00] hover:bg-[#e69900] text-black text-sm font-semibold px-4 py-[7px] rounded-lg transition-colors disabled:opacity-50 self-end whitespace-nowrap"
            >
              {quickSaving ? "Saving…" : quickSaved ? "Saved ✓" : "Log"}
            </button>
          </div>

          {showFollowers && (
            <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-gray-100">
              {([
                { key: "instagram_followers", label: "Instagram" },
                { key: "youtube_subscribers", label: "YouTube" },
                { key: "facebook_friends", label: "Facebook" },
                { key: "linkedin_connections", label: "LinkedIn" },
              ] as { key: string; label: string }[]).map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1 min-w-[100px] flex-1">
                  <label className="label">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={quickForm[key as keyof LogForm]}
                    onChange={(e) => setQuickForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="input"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-2">
            <textarea
              value={quickForm.notes}
              onChange={(e) => setQuickForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Notes (optional)…"
              rows={1}
              className="input resize-none"
            />
          </div>
        </form>
        {!goalId && <p className="text-xs text-gray-400 mt-2">No active goal — logging disabled until your coach sets your goal.</p>}
      </div>

      {/* ── Sales Calculator (collapsible) ────────────────────── */}
      <div className="card shrink-0">
        <button
          onClick={() => setShowCalc(v => !v)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Calculator size={15} className="text-[#FFAA00]" />
          <span className="text-sm font-semibold text-charcoal flex-1">Sales Calculator</span>
          {showCalc ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {showCalc && (
          <div className="mt-4">
            {/* Product selector + audience */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="label">Product</label>
                {products.length === 0 ? (
                  <p className="text-xs text-gray-400">No products set yet.</p>
                ) : (
                  <select
                    value={calcProductId}
                    onChange={(e) => setCalcProductId(e.target.value)}
                    className="input"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — ${p.price.toLocaleString()}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="w-36">
                <label className="label">Audience / Reach</label>
                <input
                  type="number"
                  min="1"
                  value={calcAudience}
                  onChange={(e) => setCalcAudience(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Funnel table */}
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Stage</th>
                    <th className="text-center px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-28">Conversion %</th>
                    <th className="text-right px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-24">People</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {calcRows.map((row) => (
                    <tr key={row.key} className={clsx("transition-colors", row.key === "sales" && "bg-[#FFF8E8]")}>
                      <td className="px-4 py-2.5">
                        <span className={clsx("text-sm", row.key === "sales" ? "font-semibold text-charcoal" : "text-charcoal")}>
                          {row.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {row.pct !== undefined ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => adjustPct(row.key, -5)}
                              className="w-5 h-5 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <ChevronDown size={11} />
                            </button>
                            <span className="text-sm font-semibold text-charcoal w-8 text-center">{calcPcts[row.key]}%</span>
                            <button
                              type="button"
                              onClick={() => adjustPct(row.key, 5)}
                              className="w-5 h-5 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <ChevronUp size={11} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 text-center block">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={clsx("font-semibold", row.key === "sales" ? "text-[#FFAA00] text-base" : "text-charcoal text-sm")}>
                          {row.value.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Predicted monthly income */}
            {selectedProduct && (
              <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Predicted Monthly Income</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {salesRow?.value ?? 0} sales × ${selectedProduct.price.toLocaleString()} ({selectedProduct.name})
                  </p>
                </div>
                <p className="font-heading font-bold text-2xl text-[#FFAA00]">${predictedMonthly.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Log History ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <p className="text-sm font-semibold text-charcoal">Log History</p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              max={todayStr()}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            />
            {filterDate && (
              <button onClick={() => setFilterDate("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            )}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">
              {filterDate ? `No log for ${filterDate}.` : "No logs yet."}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 card p-0 overflow-hidden">
            <div className="overflow-y-auto h-full">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray-100">
                    {["Date", "Income", "Exp.", "Bank", "Posts", "Calls"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                    {/* Social icons */}
                    <th title="Instagram Followers" className="px-3 py-2.5 text-left whitespace-nowrap">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="#E1306C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none" /></svg>
                    </th>
                    <th title="YouTube Subscribers" className="px-3 py-2.5 text-left whitespace-nowrap">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#FF0000"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" /></svg>
                    </th>
                    <th title="Facebook Friends" className="px-3 py-2.5 text-left whitespace-nowrap">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                    </th>
                    <th title="LinkedIn Connections" className="px-3 py-2.5 text-left whitespace-nowrap">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#0A66C2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                    </th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map((log) => {
                    const isEditing = editingId === log.id;
                    const isDeleting = deletingId === log.id;
                    return (
                      <tr key={log.id} className={isEditing ? "bg-amber-50" : "hover:bg-gray-50/60 transition-colors"}>
                        <td className="px-3 py-2.5 text-xs font-medium text-charcoal whitespace-nowrap">
                          {format(new Date(log.log_date + "T00:00:00"), "dd MMM yy")}
                        </td>
                        {isEditing ? (
                          <>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" step="0.01" {...ei("income_total")} /></td>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" step="0.01" {...ei("expenses")} /></td>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" step="0.01" {...ei("money_in_bank")} /></td>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" {...ei("posts_count")} /></td>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" {...ei("sales_calls_count")} /></td>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" {...ei("instagram_followers")} /></td>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" {...ei("youtube_subscribers")} /></td>
                            <td className="px-1.5 py-1.5"><input type="number" min="0" {...ei("facebook_friends")} /></td>
                            <td className="px-1.5 py-1.5 min-w-[160px]">
                              <div className="space-y-1">
                                <input type="number" min="0" {...ei("linkedin_connections")} />
                                <textarea placeholder="Notes…" rows={2} {...ei("notes")} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FFAA00]/50 resize-y" />
                              </div>
                            </td>
                            <td className="px-1.5 py-1.5 whitespace-nowrap">
                              <div className="flex gap-1">
                                <button onClick={() => saveEdit(log.id)} disabled={editSaving} className="bg-[#FFAA00] text-black p-1.5 rounded hover:bg-[#e69900] disabled:opacity-50">
                                  <Check size={11} />
                                </button>
                                <button onClick={() => setEditingId(null)} className="border border-gray-200 text-gray-500 p-1.5 rounded hover:bg-gray-100">
                                  <X size={11} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2.5 text-xs text-[#30B33C] font-semibold">${(log.income_total ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-red-500">${(log.expenses ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-charcoal">${(log.money_in_bank ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-charcoal">{log.posts_count ?? 0}</td>
                            <td className="px-3 py-2.5 text-xs text-charcoal">{log.sales_calls_count ?? 0}</td>
                            <td className="px-3 py-2.5 text-xs text-charcoal">{(log.instagram_followers ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-charcoal">{(log.youtube_subscribers ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-charcoal">{(log.facebook_friends ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-xs text-charcoal">{(log.linkedin_connections ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => startEdit(log)} className="text-gray-300 hover:text-[#FFAA00] transition-colors">
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => { if (window.confirm("Delete this log entry?")) deleteLog(log.id); }}
                                  disabled={isDeleting}
                                  className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                                >
                                  <Trash2 size={12} />
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
          </div>
        )}
      </div>
    </div>
  );
}
