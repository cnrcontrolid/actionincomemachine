"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";
import { Star, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import clsx from "clsx";
import CombinedProgressChart from "@/components/progress/CombinedProgressChart";
import StatCard from "@/components/ui/StatCard";
import { getRevenueTotal, getProgressPercent, getDayNumber } from "@/lib/goal-calculations";
import { TrendingUp, DollarSign, Minus, Activity } from "lucide-react";
import type { Goal, DailyLog, Profile, Win } from "@/types";

export default function ProgressPage() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);

  // Win form
  const [showWinForm, setShowWinForm] = useState(false);
  const [winForm, setWinForm] = useState({ win_date: new Date().toISOString().slice(0, 10), description: "", rating: 3 });
  const [winSaving, setWinSaving] = useState(false);

  // Win editing
  const [editingWinId, setEditingWinId] = useState<string | null>(null);
  const [editWinForm, setEditWinForm] = useState({ description: "", rating: 3 });
  const [editWinSaving, setEditWinSaving] = useState(false);
  const [deletingWinId, setDeletingWinId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [goalRes, logsRes, profileRes, winsRes] = await Promise.all([
      supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single(),
      supabase.from("daily_logs").select("*").eq("client_id", user.id).order("log_date").limit(90),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("wins").select("*").eq("client_id", user.id).order("win_date", { ascending: false }).limit(100),
    ]);

    setGoal(goalRes.data as Goal | null);
    setLogs((logsRes.data as DailyLog[] | null) ?? []);
    setProfile(profileRes.data as Profile | null);
    setWins((winsRes.data as Win[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addWin(e: React.FormEvent) {
    e.preventDefault();
    setWinSaving(true);
    const res = await fetch("/api/wins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal_id: goal?.id ?? null,
        win_date: winForm.win_date,
        description: winForm.description,
        rating: winForm.rating,
      }),
    });
    const { data } = await res.json();
    if (data) setWins((prev) => [data, ...prev]);
    setWinSaving(false);
    setShowWinForm(false);
    setWinForm({ win_date: new Date().toISOString().slice(0, 10), description: "", rating: 3 });
  }

  function startEditWin(win: Win) {
    setEditingWinId(win.id);
    setEditWinForm({ description: win.description, rating: win.rating });
  }

  async function saveEditWin(winId: string) {
    setEditWinSaving(true);
    await fetch(`/api/wins/${winId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editWinForm),
    });
    setWins((prev) => prev.map((w) => w.id === winId ? { ...w, ...editWinForm } : w));
    setEditWinSaving(false);
    setEditingWinId(null);
  }

  async function deleteWin(winId: string) {
    setDeletingWinId(winId);
    await fetch(`/api/wins/${winId}`, { method: "DELETE" });
    setWins((prev) => prev.filter((w) => w.id !== winId));
    setDeletingWinId(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;
  }

  const revenueToDate = getRevenueTotal(logs);
  const totalExpenses = logs.reduce((s, l) => s + (l.expenses ?? 0), 0);
  const netIncome = revenueToDate - totalExpenses;
  const percent = goal ? getProgressPercent(revenueToDate, goal.revenue_target) : 0;
  const dayNum = goal ? getDayNumber(goal.start_date) : 1;

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <StatCard label="Revenue to date" value={`$${revenueToDate.toLocaleString()}`} icon={DollarSign} color="amber" />
        <StatCard label="Net income" value={`$${netIncome.toLocaleString()}`} icon={TrendingUp} color={netIncome >= 0 ? "green" : "red"} />
        <StatCard label="Total expenses" value={`$${totalExpenses.toLocaleString()}`} icon={Minus} color="red" />
        <StatCard label="Goal progress" value={`${Math.round(percent)}%`} icon={Activity} color="amber" sub={`Day ${dayNum} of 90`} />
      </div>

      {/* ── Wins + Chart ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex gap-4">

        {/* Wins panel */}
        <div className="w-72 shrink-0 flex flex-col min-h-0">
          <div className="card flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-charcoal">Wins</span>
                <span className="text-xs text-gray-400">{wins.length}</span>
              </div>
              <button
                onClick={() => setShowWinForm(v => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#FFAA00] hover:underline"
              >
                <Plus size={12} />
                Add Win
              </button>
            </div>

            {/* Add win form */}
            {showWinForm && (
              <form onSubmit={addWin} className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2 shrink-0">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={winForm.win_date}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setWinForm(p => ({ ...p, win_date: e.target.value }))}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">What did you win?</label>
                  <textarea
                    required
                    value={winForm.description}
                    onChange={(e) => setWinForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the win…"
                    rows={2}
                    className="input resize-none text-xs"
                  />
                </div>
                <div>
                  <label className="label">Rating</label>
                  <StarRating value={winForm.rating} onChange={(r) => setWinForm(p => ({ ...p, rating: r }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={winSaving}
                    className="bg-[#FFAA00] text-black text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {winSaving ? "Saving…" : "Save Win"}
                  </button>
                  <button type="button" onClick={() => setShowWinForm(false)} className="text-xs text-gray-400">Cancel</button>
                </div>
              </form>
            )}

            {/* Wins list */}
            <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
              {wins.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🏆</p>
                  <p className="text-sm text-gray-400">No wins logged yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Every win counts — log them all!</p>
                </div>
              ) : (
                wins.map((win) => {
                  const isEditing = editingWinId === win.id;
                  const isDeleting = deletingWinId === win.id;
                  return (
                    <div
                      key={win.id}
                      className={clsx(
                        "rounded-xl border p-3 transition-colors",
                        isEditing ? "border-[#FFAA00]/30 bg-[#FFF8E8]" : "border-gray-100 bg-white hover:border-gray-200"
                      )}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editWinForm.description}
                            onChange={(e) => setEditWinForm(p => ({ ...p, description: e.target.value }))}
                            rows={2}
                            className="input resize-none text-xs"
                          />
                          <StarRating value={editWinForm.rating} onChange={(r) => setEditWinForm(p => ({ ...p, rating: r }))} />
                          <div className="flex gap-1.5 pt-1">
                            <button onClick={() => saveEditWin(win.id)} disabled={editWinSaving} className="bg-[#FFAA00] text-black text-xs font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50">
                              <Check size={11} className="inline" /> Save
                            </button>
                            <button onClick={() => setEditingWinId(null)} className="text-xs text-gray-400 px-2">
                              <X size={11} className="inline" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-charcoal leading-snug flex-1">{win.description}</p>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => startEditWin(win)} className="text-gray-300 hover:text-[#FFAA00] transition-colors">
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => { if (window.confirm("Delete this win?")) deleteWin(win.id); }}
                                disabled={isDeleting}
                                className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <StarDisplay rating={win.rating} />
                            <span className="text-[11px] text-gray-400">
                              {format(parseISO(win.win_date), "d MMM")}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <CombinedProgressChart goal={goal} logs={logs} profile={profile} />
        </div>
      </div>
    </div>
  );
}

// Star rating selector
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={16}
            className={clsx("transition-colors", n <= value ? "fill-[#FFAA00] text-[#FFAA00]" : "text-gray-200")}
          />
        </button>
      ))}
    </div>
  );
}

// Star display (read-only)
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={clsx(n <= rating ? "fill-[#FFAA00] text-[#FFAA00]" : "text-gray-200")}
        />
      ))}
    </div>
  );
}
