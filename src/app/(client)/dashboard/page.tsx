"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { CheckCircle2, Circle, ExternalLink, TrendingUp, DollarSign, Activity, Minus } from "lucide-react";
import clsx from "clsx";
import { getRevenueTotal, getProgressPercent, getDayNumber } from "@/lib/goal-calculations";
import type { Goal, DailyLog, DailyAction, DailyActionCompletion, Product } from "@/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface LogForm {
  income_total: string;
  expenses: string;
  money_in_bank: string;
  posts_count: string;
  sales_calls_count: string;
  notes: string;
}

const emptyForm: LogForm = {
  income_total: "0",
  expenses: "0",
  money_in_bank: "0",
  posts_count: "0",
  sales_calls_count: "0",
  notes: "",
};

export default function DashboardPage() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<LogForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [, startTransition] = useTransition();

  const today = todayStr();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [goalRes, logsRes, actionsRes, completionsRes, productsRes] = await Promise.all([
      supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single(),
      supabase.from("daily_logs").select("*").eq("client_id", user.id).order("log_date").limit(90),
      supabase.from("daily_actions").select("*").eq("client_id", user.id).eq("is_active", true).order("sort_order"),
      supabase.from("daily_action_completions").select("*").eq("client_id", user.id).eq("log_date", today),
      supabase.from("products").select("*").eq("client_id", user.id).eq("is_active", true),
    ]);

    const g = goalRes.data as Goal | null;
    setGoal(g);

    const allActions = (actionsRes.data as DailyAction[] | null) ?? [];
    const goalActions = g ? allActions.filter((a) => a.goal_id === g.id) : allActions;
    setActions(goalActions);

    setLogs((logsRes.data as DailyLog[] | null) ?? []);
    setProducts((productsRes.data as Product[] | null) ?? []);

    const compMap: Record<string, boolean> = {};
    for (const c of (completionsRes.data as DailyActionCompletion[] | null) ?? []) {
      compMap[c.action_id] = c.completed;
    }
    setCompletions(compMap);

    const todayLog = ((logsRes.data as DailyLog[] | null) ?? []).find((l) => l.log_date === today);
    if (todayLog) {
      setForm({
        income_total: (todayLog.income_total ?? 0).toString(),
        expenses: (todayLog.expenses ?? 0).toString(),
        money_in_bank: (todayLog.money_in_bank ?? 0).toString(),
        posts_count: (todayLog.posts_count ?? 0).toString(),
        sales_calls_count: (todayLog.sales_calls_count ?? 0).toString(),
        notes: todayLog.notes ?? "",
      });
    }

    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  async function saveLog(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    setSaving(true);
    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal_id: goal.id,
        log_date: today,
        income_total: parseFloat(form.income_total) || 0,
        expenses: parseFloat(form.expenses) || 0,
        money_in_bank: parseFloat(form.money_in_bank) || 0,
        posts_count: parseInt(form.posts_count) || 0,
        sales_calls_count: parseInt(form.sales_calls_count) || 0,
        notes: form.notes,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    load();
  }

  async function toggleAction(actionId: string) {
    const next = !completions[actionId];
    setCompletions((prev) => ({ ...prev, [actionId]: next }));
    startTransition(async () => {
      await fetch("/api/action-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: actionId, log_date: today, completed: next }),
      });
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;
  }

  const revenueToDate = getRevenueTotal(logs);
  const totalExpenses = logs.reduce((s, l) => s + (l.expenses ?? 0), 0);
  const netIncome = revenueToDate - totalExpenses;
  const percent = goal ? getProgressPercent(revenueToDate, goal.revenue_target) : 0;
  const dayNum = goal ? getDayNumber(goal.start_date) : 1;
  const completedCount = actions.filter((a) => completions[a.id]).length;
  const totalCount = actions.length;
  const actionPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Stats row ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {([
          { label: "Revenue to date", value: `$${revenueToDate.toLocaleString()}`, icon: DollarSign, color: "text-[#FFAA00]", bg: "bg-[#FFF8E8]" },
          { label: "Net income", value: `$${netIncome.toLocaleString()}`, icon: TrendingUp, color: netIncome >= 0 ? "text-[#30B33C]" : "text-red-500", bg: netIncome >= 0 ? "bg-[#F0FAF1]" : "bg-red-50" },
          { label: "Total expenses", value: `$${totalExpenses.toLocaleString()}`, icon: Minus, color: "text-red-500", bg: "bg-red-50" },
          { label: "Goal progress", value: `${Math.round(percent)}%`, icon: Activity, color: "text-[#FFAA00]", bg: "bg-[#FFF8E8]", sub: `Day ${dayNum} of 90` },
        ] as { label: string; value: string; icon: React.ElementType; color: string; bg: string; sub?: string }[]).map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="card flex items-center gap-3 py-3.5">
            <div className={clsx("p-2 rounded-lg shrink-0", bg)}>
              <Icon size={16} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide truncate">{label}</p>
              <p className={clsx("font-heading font-bold text-lg leading-tight", color)}>{value}</p>
              {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main: Log form left + Actions right ────────── */}
      <div className="flex-1 min-h-0 flex gap-4">

        {/* Left column: log form + progress */}
        <div className="flex flex-col gap-4 w-[340px] shrink-0 overflow-y-auto">

          {/* Log form */}
          <div className="card shrink-0">
            <p className="text-sm font-semibold text-charcoal mb-3">
              Today — {format(new Date(), "dd MMM yyyy")}
            </p>
            {!goal ? (
              <p className="text-xs text-gray-400">No active goal yet. Your coach will set this up.</p>
            ) : (
              <form onSubmit={saveLog} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: "income_total", label: "Income ($)", step: "0.01" },
                    { key: "expenses", label: "Expenses ($)", step: "0.01" },
                    { key: "money_in_bank", label: "Bank ($)", step: "0.01" },
                    { key: "posts_count", label: "Posts", step: "1" },
                    { key: "sales_calls_count", label: "Sales Calls", step: "1" },
                  ] as { key: string; label: string; step: string }[]).map(({ key, label, step }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <input
                        type="number"
                        min="0"
                        step={step}
                        value={form[key as keyof LogForm]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="input"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional…"
                    rows={2}
                    className="input resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#FFAA00] hover:bg-[#e69900] text-black text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : saved ? "Saved ✓" : "Save Today's Numbers"}
                </button>
              </form>
            )}
          </div>

          {/* Progress bars */}
          {goal && (
            <div className="card shrink-0 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Goal Progress</p>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-charcoal font-medium">90-Day Target</span>
                  <span className="text-xs text-gray-400">${revenueToDate.toLocaleString()} / ${goal.revenue_target.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFAA00] rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>

              {([
                { label: "Month 1", target: goal.month1_target },
                { label: "Month 2", target: goal.month2_target },
                { label: "Month 3", target: goal.month3_target },
              ] as { label: string; target: number | null }[]).map(({ label, target }) => {
                if (!target) return null;
                const pct = Math.min(100, (revenueToDate / target) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-charcoal font-medium">{label}</span>
                      <span className="text-xs text-gray-400">${target.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={clsx("h-full rounded-full transition-all duration-500", pct >= 100 ? "bg-[#30B33C]" : "bg-[#FFAA00]/70")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {products.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Products</p>
                  <div className="space-y-1">
                    {products.map((p) => (
                      <div key={p.id} className="flex justify-between">
                        <span className="text-xs text-charcoal truncate">{p.name}</span>
                        <span className="text-xs font-semibold text-[#FFAA00] ml-2 shrink-0">${p.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Today's Actions */}
        <div className="flex-1 min-h-0 card flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-charcoal">Today&apos;s Actions</span>
              <span className="text-xs text-gray-400">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#30B33C] rounded-full transition-all duration-500"
                style={{ width: `${actionPct}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto -mx-1">
            {actions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No actions set yet. Your coach will add them after your goal session.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {actions.map((action) => {
                  const done = !!completions[action.id];
                  return (
                    <li key={action.id}>
                      <button
                        onClick={() => toggleAction(action.id)}
                        className={clsx(
                          "flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors",
                          done ? "text-gray-400" : "text-charcoal hover:bg-gray-50"
                        )}
                      >
                        {done ? (
                          <CheckCircle2 size={16} className="text-[#30B33C] shrink-0" />
                        ) : (
                          <Circle size={16} className="text-gray-300 shrink-0" />
                        )}
                        <span className={clsx("text-sm flex-1 text-left", done && "line-through")}>
                          {action.label}
                        </span>
                        {action.group_name && (
                          <span className="text-[10px] text-gray-300 font-medium shrink-0 bg-gray-50 px-1.5 py-0.5 rounded">
                            {action.group_name}
                          </span>
                        )}
                        {action.link_url && (
                          <a
                            href={action.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-300 hover:text-[#FFAA00] shrink-0"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
