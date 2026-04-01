"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRevenueTotal, getProgressPercent, getDayNumber, getDaysRemaining } from "@/lib/goal-calculations";
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Check, X, ChevronRight, FolderOpen, Target as TargetIcon, Calendar, ExternalLink } from "lucide-react";
import clsx from "clsx";
import type { Goal, AnnualGoal, Product, Target, DailyLog, Project } from "@/types";

type GoalTab = "overview" | "projects" | "targets" | "products";

const tierLabel: Record<string, string> = {
  low: "Low ticket ($7–$27)",
  mid: "Mid ticket ($997–$2997)",
  high: "High ticket ($6997–$9997)",
};

export default function GoalsPage() {
  const [annualGoals, setAnnualGoals] = useState<AnnualGoal[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GoalTab>("overview");

  // Annual goal form
  const [showAnnualForm, setShowAnnualForm] = useState(false);
  const [annualForm, setAnnualForm] = useState({ title: "", target_amount: "", year: new Date().getFullYear().toString(), notes: "" });
  const [annualSaving, setAnnualSaving] = useState(false);

  // 90-day goal edit
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "",
    purpose: "",
    revenue_target: "",
    month1_target: "",
    month2_target: "",
    month3_target: "",
    start_date: "",
    end_date: "",
    notes: "",
    zoom_link: "",
    policies: [""],
    plan_steps: [""],
  });
  const [goalSaving, setGoalSaving] = useState(false);

  // New 90-day goal form
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({
    annual_goal_id: "",
    title: "",
    purpose: "",
    revenue_target: "",
    start_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [newGoalSaving, setNewGoalSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [annualRes, goalRes, projectsRes, targetsRes, productsRes, logsRes] = await Promise.all([
        supabase.from("annual_goals").select("*").eq("client_id", user.id).order("year", { ascending: false }),
        supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single(),
        supabase.from("projects").select("*").eq("client_id", user.id).eq("is_active", true).order("sort_order"),
        supabase.from("targets").select("*").eq("client_id", user.id).order("sort_order"),
        supabase.from("products").select("*").eq("client_id", user.id).eq("is_active", true).order("tier"),
        supabase.from("daily_logs").select("*").eq("client_id", user.id).limit(90),
      ]);
      setAnnualGoals((annualRes.data as AnnualGoal[] | null) ?? []);
      const g = goalRes.data as Goal | null;
      setGoal(g);
      if (g) {
        setGoalForm({
          title: g.title,
          purpose: g.purpose ?? "",
          revenue_target: g.revenue_target.toString(),
          month1_target: g.month1_target?.toString() ?? "",
          month2_target: g.month2_target?.toString() ?? "",
          month3_target: g.month3_target?.toString() ?? "",
          start_date: g.start_date,
          end_date: g.end_date,
          notes: g.notes ?? "",
          zoom_link: g.zoom_link ?? "",
          policies: (g.policies ?? []).length > 0 ? g.policies : [""],
          plan_steps: (g.plan_steps ?? []).length > 0 ? g.plan_steps : [""],
        });
      }
      const allProjects = (projectsRes.data as Project[] | null) ?? [];
      const goalProjects = g ? allProjects.filter((p) => p.goal_id === g.id) : [];
      setProjects(goalProjects);
      const allTargets = (targetsRes.data as Target[] | null) ?? [];
      const goalTargets = g ? allTargets.filter((t) => t.goal_id === g.id) : [];
      setTargets(goalTargets);
      setProducts((productsRes.data as Product[] | null) ?? []);
      setLogs((logsRes.data as DailyLog[] | null) ?? []);
      setLoading(false);
    });
  }, []);

  async function saveAnnualGoal(e: React.FormEvent) {
    e.preventDefault();
    setAnnualSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("annual_goals").insert({
      client_id: user.id,
      title: annualForm.title,
      target_amount: parseFloat(annualForm.target_amount) || 0,
      year: parseInt(annualForm.year),
      notes: annualForm.notes || null,
    });
    const { data } = await supabase.from("annual_goals").select("*").eq("client_id", user.id).order("year", { ascending: false });
    setAnnualGoals((data as AnnualGoal[] | null) ?? []);
    setShowAnnualForm(false);
    setAnnualForm({ title: "", target_amount: "", year: new Date().getFullYear().toString(), notes: "" });
    setAnnualSaving(false);
  }

  async function saveGoalEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    setGoalSaving(true);
    const supabase = createClient();
    const policies = goalForm.policies.filter(Boolean);
    const plan_steps = goalForm.plan_steps.filter(Boolean);
    await supabase.from("goals").update({
      title: goalForm.title,
      purpose: goalForm.purpose || null,
      revenue_target: parseFloat(goalForm.revenue_target) || 0,
      month1_target: goalForm.month1_target ? parseFloat(goalForm.month1_target) : null,
      month2_target: goalForm.month2_target ? parseFloat(goalForm.month2_target) : null,
      month3_target: goalForm.month3_target ? parseFloat(goalForm.month3_target) : null,
      start_date: goalForm.start_date,
      end_date: goalForm.end_date,
      notes: goalForm.notes || null,
      zoom_link: goalForm.zoom_link || null,
      policies,
      plan_steps,
    }).eq("id", goal.id);
    const { data } = await supabase.from("goals").select("*").eq("id", goal.id).single();
    const g = data as Goal | null;
    setGoal(g);
    if (g) {
      setGoalForm({
        title: g.title,
        purpose: g.purpose ?? "",
        revenue_target: g.revenue_target.toString(),
        month1_target: g.month1_target?.toString() ?? "",
        month2_target: g.month2_target?.toString() ?? "",
        month3_target: g.month3_target?.toString() ?? "",
        start_date: g.start_date,
        end_date: g.end_date,
        notes: g.notes ?? "",
        zoom_link: g.zoom_link ?? "",
        policies: (g.policies ?? []).length > 0 ? g.policies : [""],
        plan_steps: (g.plan_steps ?? []).length > 0 ? g.plan_steps : [""],
      });
    }
    setEditingGoal(false);
    setGoalSaving(false);
  }

  async function saveNewGoal(e: React.FormEvent) {
    e.preventDefault();
    setNewGoalSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const start = new Date(newGoalForm.start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + 89);
    await supabase.from("goals").insert({
      client_id: user.id,
      annual_goal_id: newGoalForm.annual_goal_id || null,
      title: newGoalForm.title,
      purpose: newGoalForm.purpose || null,
      revenue_target: parseFloat(newGoalForm.revenue_target) || 0,
      start_date: newGoalForm.start_date,
      end_date: end.toISOString().slice(0, 10),
      status: "active",
      notes: newGoalForm.notes || null,
      policies: [],
      plan_steps: [],
    });
    setShowNewGoalForm(false);
    setNewGoalSaving(false);
    window.location.reload();
  }

  function addListItem(field: "policies" | "plan_steps") {
    setGoalForm((p) => ({ ...p, [field]: [...p[field], ""] }));
  }

  function updateListItem(field: "policies" | "plan_steps", idx: number, val: string) {
    setGoalForm((p) => {
      const arr = [...p[field]];
      arr[idx] = val;
      return { ...p, [field]: arr };
    });
  }

  function removeListItem(field: "policies" | "plan_steps", idx: number) {
    setGoalForm((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  }

  if (loading) return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;

  const revenueToDate = getRevenueTotal(logs);
  const percent = goal ? getProgressPercent(revenueToDate, goal.revenue_target) : 0;
  const dayNum = goal ? getDayNumber(goal.start_date) : 1;
  const daysLeft = goal ? getDaysRemaining(goal.end_date) : 0;

  const tabs: { key: GoalTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "projects", label: `Projects (${projects.length})` },
    { key: "targets", label: `Targets (${targets.length})` },
    { key: "products", label: "Products" },
  ];

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Annual Goals strip ─────────────────────────────── */}
      <div className="shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Annual Goals</p>
          <button
            onClick={() => setShowAnnualForm(v => !v)}
            className="text-[11px] text-[#FFAA00] font-semibold hover:underline"
          >
            + Add
          </button>
        </div>

        {showAnnualForm && (
          <form onSubmit={saveAnnualGoal} className="card mb-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="label">Title</label>
                <input required value={annualForm.title} onChange={(e) => setAnnualForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Build to $250k" />
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" value={annualForm.year} onChange={(e) => setAnnualForm(p => ({ ...p, year: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Target Amount ($)</label>
                <input type="number" min="0" step="1000" value={annualForm.target_amount} onChange={(e) => setAnnualForm(p => ({ ...p, target_amount: e.target.value }))} className="input" />
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <input value={annualForm.notes} onChange={(e) => setAnnualForm(p => ({ ...p, notes: e.target.value }))} className="input" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={annualSaving} className="bg-[#FFAA00] text-black text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50">
                {annualSaving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setShowAnnualForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-3">Cancel</button>
            </div>
          </form>
        )}

        {annualGoals.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {annualGoals.map((ag) => (
              <div key={ag.id} className="card py-2.5 px-3.5 shrink-0 min-w-[180px]">
                <p className="text-xs font-semibold text-charcoal">{ag.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-[#FFAA00] font-semibold">${ag.target_amount.toLocaleString()}</span>
                  <span className="text-[11px] text-gray-400">{ag.year}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Active 90-day Goal ─────────────────────────────── */}
      {!goal ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <p className="font-heading font-bold text-lg text-charcoal">No active 90-day goal</p>
            <p className="text-sm text-gray-400 mt-1">Create one to get started, or wait for your coach to set it up.</p>
          </div>
          <button
            onClick={() => setShowNewGoalForm(v => !v)}
            className="flex items-center gap-2 bg-[#FFAA00] text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e69900] transition-colors"
          >
            <Plus size={14} />
            New 90-Day Goal
          </button>
          {showNewGoalForm && (
            <form onSubmit={saveNewGoal} className="card w-full max-w-lg space-y-3 mt-2">
              <p className="text-sm font-semibold text-charcoal">New 90-Day Goal</p>
              <div>
                <label className="label">Title</label>
                <input required value={newGoalForm.title} onChange={(e) => setNewGoalForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Q1 Revenue Sprint" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Revenue Target ($)</label>
                  <input type="number" min="0" value={newGoalForm.revenue_target} onChange={(e) => setNewGoalForm(p => ({ ...p, revenue_target: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={newGoalForm.start_date} onChange={(e) => setNewGoalForm(p => ({ ...p, start_date: e.target.value }))} className="input" />
                </div>
              </div>
              {annualGoals.length > 0 && (
                <div>
                  <label className="label">Link to Annual Goal (optional)</label>
                  <select value={newGoalForm.annual_goal_id} onChange={(e) => setNewGoalForm(p => ({ ...p, annual_goal_id: e.target.value }))} className="input">
                    <option value="">— None —</option>
                    {annualGoals.map((ag) => <option key={ag.id} value={ag.id}>{ag.title} ({ag.year})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Purpose</label>
                <textarea value={newGoalForm.purpose} onChange={(e) => setNewGoalForm(p => ({ ...p, purpose: e.target.value }))} rows={2} className="input resize-none" placeholder="Why this goal matters…" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={newGoalSaving} className="bg-[#FFAA00] text-black text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50">
                  {newGoalSaving ? "Creating…" : "Create Goal"}
                </button>
                <button type="button" onClick={() => setShowNewGoalForm(false)} className="text-sm text-gray-400 px-3">Cancel</button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="flex gap-5 flex-1 min-h-0">

          {/* Left: goal summary card */}
          <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
            <div className="card">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-base text-charcoal leading-snug">{goal.title}</p>
                  {goal.annual_goal_id && annualGoals.find(ag => ag.id === goal.annual_goal_id) && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <ChevronRight size={10} className="text-gray-300" />
                      <span className="text-[11px] text-gray-400">{annualGoals.find(ag => ag.id === goal.annual_goal_id)?.title}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setEditingGoal(v => !v)} className="text-gray-300 hover:text-[#FFAA00] transition-colors ml-2 shrink-0">
                  <Pencil size={14} />
                </button>
              </div>

              {/* Progress ring-style bar */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-charcoal">${revenueToDate.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">${goal.revenue_target.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFAA00] rounded-full transition-all" style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] text-gray-400">Day {dayNum} of 90</span>
                  <span className="text-[11px] text-gray-400">{daysLeft}d left</span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
                <Calendar size={11} />
                <span>{format(parseISO(goal.start_date), "d MMM")} — {format(parseISO(goal.end_date), "d MMM yyyy")}</span>
              </div>

              {/* Purpose */}
              {goal.purpose && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Purpose</p>
                  <p className="text-xs text-charcoal leading-relaxed">{goal.purpose}</p>
                </div>
              )}

              {/* Zoom link */}
              {goal.zoom_link && (
                <a href={goal.zoom_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#FFAA00] hover:underline mb-2">
                  <ExternalLink size={12} />Join Coaching Session
                </a>
              )}

              {/* Notes */}
              {goal.notes && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes from coach</p>
                  <p className="text-xs text-charcoal leading-relaxed">{goal.notes}</p>
                </div>
              )}
            </div>

            {/* Plan steps */}
            {(goal.plan_steps ?? []).filter(Boolean).length > 0 && (
              <div className="card">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Plan</p>
                <ol className="space-y-1.5">
                  {goal.plan_steps.filter(Boolean).map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-charcoal">
                      <span className="text-[#FFAA00] font-bold shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Policies */}
            {(goal.policies ?? []).filter(Boolean).length > 0 && (
              <div className="card">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Policies</p>
                <ul className="space-y-1.5">
                  {goal.policies.filter(Boolean).map((policy, i) => (
                    <li key={i} className="flex gap-2 text-xs text-charcoal">
                      <span className="text-[#30B33C] shrink-0">✓</span>
                      <span>{policy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: tabbed content */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Edit goal form */}
            {editingGoal && (
              <form onSubmit={saveGoalEdit} className="card mb-3 shrink-0 space-y-3">
                <p className="text-sm font-semibold text-charcoal">Edit 90-Day Goal</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="label">Title</label>
                    <input required value={goalForm.title} onChange={(e) => setGoalForm(p => ({ ...p, title: e.target.value }))} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Purpose (why this goal matters)</label>
                    <textarea value={goalForm.purpose} onChange={(e) => setGoalForm(p => ({ ...p, purpose: e.target.value }))} rows={2} className="input resize-none" />
                  </div>
                  <div>
                    <label className="label">Revenue Target ($)</label>
                    <input type="number" min="0" value={goalForm.revenue_target} onChange={(e) => setGoalForm(p => ({ ...p, revenue_target: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="label">Start Date</label>
                    <input type="date" value={goalForm.start_date} onChange={(e) => setGoalForm(p => ({ ...p, start_date: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="label">Month 1 Target ($)</label>
                    <input type="number" min="0" value={goalForm.month1_target} onChange={(e) => setGoalForm(p => ({ ...p, month1_target: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="label">Month 2 Target ($)</label>
                    <input type="number" min="0" value={goalForm.month2_target} onChange={(e) => setGoalForm(p => ({ ...p, month2_target: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="label">Month 3 Target ($)</label>
                    <input type="number" min="0" value={goalForm.month3_target} onChange={(e) => setGoalForm(p => ({ ...p, month3_target: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="label">Zoom Link</label>
                    <input type="url" value={goalForm.zoom_link} onChange={(e) => setGoalForm(p => ({ ...p, zoom_link: e.target.value }))} className="input" placeholder="https://zoom.us/…" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Notes (from coach)</label>
                    <textarea value={goalForm.notes} onChange={(e) => setGoalForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="input resize-none" />
                  </div>
                </div>

                {/* Plan steps */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Plan Steps</label>
                    <button type="button" onClick={() => addListItem("plan_steps")} className="text-[11px] text-[#FFAA00] font-semibold">+ Add Step</button>
                  </div>
                  {goalForm.plan_steps.map((s, i) => (
                    <div key={i} className="flex gap-2 mb-1">
                      <span className="text-xs text-gray-400 mt-2 w-4 shrink-0">{i + 1}.</span>
                      <input value={s} onChange={(e) => updateListItem("plan_steps", i, e.target.value)} className="input flex-1" placeholder={`Step ${i + 1}`} />
                      <button type="button" onClick={() => removeListItem("plan_steps", i)} className="text-gray-300 hover:text-red-400 mt-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Policies */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Policies</label>
                    <button type="button" onClick={() => addListItem("policies")} className="text-[11px] text-[#FFAA00] font-semibold">+ Add Policy</button>
                  </div>
                  {goalForm.policies.map((p, i) => (
                    <div key={i} className="flex gap-2 mb-1">
                      <input value={p} onChange={(e) => updateListItem("policies", i, e.target.value)} className="input flex-1" placeholder={`Policy ${i + 1}`} />
                      <button type="button" onClick={() => removeListItem("policies", i)} className="text-gray-300 hover:text-red-400 mt-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={goalSaving} className="bg-[#FFAA00] text-black text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50">
                    {goalSaving ? "Saving…" : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setEditingGoal(false)} className="text-sm text-gray-400 px-3">Cancel</button>
                </div>
              </form>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit mb-3 shrink-0">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={clsx(
                    "px-4 py-1.5 text-[13px] font-semibold rounded-md transition-all",
                    activeTab === key ? "bg-white text-charcoal shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto card p-0">
              <div className="p-5">

                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {/* Month targets summary */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Monthly Targets</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Month 1", target: goal.month1_target },
                          { label: "Month 2", target: goal.month2_target },
                          { label: "Month 3", target: goal.month3_target },
                        ].map(({ label, target }) => (
                          <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
                            <p className="text-[11px] text-gray-400 font-semibold">{label}</p>
                            <p className="font-heading font-bold text-base text-charcoal">
                              {target ? `$${target.toLocaleString()}` : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 text-center py-4">
                      Switch to <strong>Projects</strong> or <strong>Targets</strong> tabs to manage your work.
                    </p>
                  </div>
                )}

                {/* Projects */}
                {activeTab === "projects" && (
                  <div>
                    {projects.length === 0 ? (
                      <div className="text-center py-8">
                        <FolderOpen size={32} className="mx-auto mb-2 text-gray-200" />
                        <p className="text-sm text-gray-400">No projects yet. Your coach can add project templates, or you can manage actions directly.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projects.map((project) => (
                          <div key={project.id} className="border border-gray-100 rounded-xl p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-charcoal">{project.name}</p>
                                {project.description && <p className="text-xs text-gray-400 mt-0.5">{project.description}</p>}
                              </div>
                              {project.estimated_hours && (
                                <span className="text-[11px] text-gray-400 shrink-0 ml-2">{project.estimated_hours}h est.</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Targets */}
                {activeTab === "targets" && (
                  <div>
                    {targets.length === 0 ? (
                      <div className="text-center py-8">
                        <TargetIcon size={32} className="mx-auto mb-2 text-gray-200" />
                        <p className="text-sm text-gray-400">No targets set yet. Your coach will add these.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[
                          { type: "major", label: "Major Targets", color: "text-[#FFAA00]", bg: "bg-[#FFF8E8]" },
                          { type: "production", label: "Production Targets", color: "text-blue-500", bg: "bg-blue-50" },
                          { type: "critical", label: "Critical Targets", color: "text-red-500", bg: "bg-red-50" },
                        ].map(({ type, label, color, bg }) => {
                          const group = targets.filter((t) => (t.target_type ?? t.type) === type);
                          if (group.length === 0) return null;
                          return (
                            <div key={type}>
                              <div className={clsx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold mb-2", color, bg)}>{label}</div>
                              <div className="space-y-2 mb-4">
                                {group.map((t) => (
                                  <TargetRow key={t.id} target={t} goalId={goal.id} onToggle={async (id, met) => {
                                    const supabase = createClient();
                                    await supabase.from("targets").update({ is_met: met, met_at: met ? new Date().toISOString() : null }).eq("id", id);
                                    setTargets((prev) => prev.map((x) => x.id === id ? { ...x, is_met: met } : x));
                                  }} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                {activeTab === "products" && (
                  <div>
                    {products.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No products set yet. Your coach will add these.</p>
                    ) : (
                      <div className="space-y-2">
                        {products.map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-charcoal">{p.name}</p>
                              <p className="text-xs text-gray-400">{tierLabel[p.tier]}</p>
                            </div>
                            <p className="font-heading font-bold text-[#FFAA00]">${p.price.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Target row sub-component
function TargetRow({
  target,
  goalId: _goalId,
  onToggle,
}: {
  target: Target;
  goalId: string;
  onToggle: (id: string, met: boolean) => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  async function handleToggle() {
    setToggling(true);
    await onToggle(target.id, !target.is_met);
    setToggling(false);
  }
  return (
    <div className={clsx("flex items-start gap-3 p-3 rounded-lg border transition-colors", target.is_met ? "border-[#30B33C]/20 bg-[#F0FAF1]" : "border-gray-100 bg-white hover:border-gray-200")}>
      <button onClick={handleToggle} disabled={toggling} className="mt-0.5 shrink-0">
        {target.is_met ? (
          <Check size={16} className="text-[#30B33C]" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm font-medium", target.is_met ? "text-gray-400 line-through" : "text-charcoal")}>{target.title}</p>
        {target.description && <p className="text-xs text-gray-400 mt-0.5">{target.description}</p>}
        <div className="flex items-center gap-3 mt-1">
          {target.due_date && (
            <span className="text-[11px] text-gray-400">Due {format(parseISO(target.due_date), "d MMM")}</span>
          )}
          {target.recurrence !== "none" && target.recurrence && (
            <span className="text-[11px] text-blue-400 capitalize">{target.recurrence}</span>
          )}
        </div>
      </div>
    </div>
  );
}

