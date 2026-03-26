"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronDown as CollapseIcon,
} from "lucide-react";
import {
  getRevenueTotal,
  getProgressPercent,
  getDayNumber,
  getDaysRemaining,
} from "@/lib/goal-calculations";
import ProgressRing from "@/components/ui/ProgressRing";
import TargetsList from "@/components/goals/TargetsList";
import type {
  Profile,
  Goal,
  DailyLog,
  Target,
  DailyAction,
  Product,
  ActionTemplate,
  ActionTemplateItem,
} from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "overview" | "goal" | "actions" | "products";

interface TargetInput {
  type: "critical" | "major";
  title: string;
  description: string;
  due_date: string;
}

interface ProductRow {
  name: string;
  price: string;
  currency: string;
}

const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "INR", "AUD"];

const PRODUCT_TIERS = [
  { value: "low", label: "Low Ticket", range: "$7–$27" },
  { value: "mid", label: "Mid Ticket", range: "$997–$2,997" },
  { value: "high", label: "High Ticket", range: "$6,997–$9,997" },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminClientDetailPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { clientId } = params;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Shared data
  const [client, setClient] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: profileData },
      { data: goalData },
      { data: logsData },
      { data: targetsData },
      { data: actionsData },
      { data: productsData },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", clientId).single(),
      supabase
        .from("goals")
        .select("*")
        .eq("client_id", clientId)
        .eq("status", "active")
        .single(),
      supabase
        .from("daily_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("log_date", { ascending: false }),
      supabase
        .from("targets")
        .select("*")
        .eq("client_id", clientId)
        .order("sort_order"),
      supabase
        .from("daily_actions")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("products")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true),
    ]);

    setClient(profileData as Profile | null);
    setGoal(goalData as Goal | null);
    setLogs((logsData as DailyLog[] | null) ?? []);
    setTargets((targetsData as Target[] | null) ?? []);
    setActions((actionsData as DailyAction[] | null) ?? []);
    setProducts((productsData as Product[] | null) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-warmgray">
        Loading…
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-warmgray">Client not found.</div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "goal", label: "Set Goal" },
    { id: "actions", label: "Daily Actions" },
    { id: "products", label: "Products" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <Link
          href="/admin/clients"
          className="text-sm text-warmgray hover:text-amber-brand mb-1 inline-block"
        >
          ← All clients
        </Link>
        <h1 className="font-heading font-bold text-3xl text-charcoal">
          {client.full_name ?? "Unnamed client"}
        </h1>
        <p className="text-warmgray text-sm">
          {client.email}
          {client.phone && ` • ${client.phone}`}
        </p>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 mb-6 -mx-6 px-6">
        <nav className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-[#FFAA00] text-[#FFAA00]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Panels */}
      {activeTab === "overview" && (
        <OverviewPanel
          client={client}
          goal={goal}
          logs={logs}
          targets={targets}
          actions={actions}
          clientId={clientId}
        />
      )}
      {activeTab === "goal" && (
        <SetGoalPanel
          clientId={clientId}
          onSaved={() => {
            loadData();
            setActiveTab("overview");
          }}
        />
      )}
      {activeTab === "actions" && (
        <ActionsPanel
          clientId={clientId}
          goal={goal}
          actions={actions}
          setActions={setActions}
        />
      )}
      {activeTab === "products" && (
        <ProductsPanel
          clientId={clientId}
          goal={goal}
          products={products}
          setProducts={setProducts}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Panel
// ---------------------------------------------------------------------------

function OverviewPanel({
  client,
  goal,
  logs,
  targets,
  actions,
  clientId,
}: {
  client: Profile;
  goal: Goal | null;
  logs: DailyLog[];
  targets: Target[];
  actions: DailyAction[];
  clientId: string;
}) {
  const revenueToDate = getRevenueTotal(logs);
  const percent = goal ? getProgressPercent(revenueToDate, goal.revenue_target) : 0;
  const dayNum = goal ? getDayNumber(goal.start_date) : null;
  const daysLeft = goal ? getDaysRemaining(goal.end_date) : null;

  return (
    <div className="space-y-6">
      {goal ? (
        <>
          <div className="card flex flex-col sm:flex-row items-center gap-6">
            <ProgressRing
              percent={percent}
              size={120}
              label={`${Math.round(percent)}%`}
              sublabel="of target"
            />
            <div className="flex-1 space-y-2">
              <h3 className="font-heading font-bold text-xl text-charcoal">
                {goal.title}
              </h3>
              <p className="text-warmgray text-sm">
                Day {dayNum} of 90 • {daysLeft} days remaining
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-wash rounded-xl p-3">
                  <p className="text-xs text-warmgray font-medium">
                    Revenue to date
                  </p>
                  <p className="font-heading font-bold text-amber-brand text-xl">
                    ${revenueToDate.toLocaleString()}
                  </p>
                </div>
                <div className="bg-amber-wash rounded-xl p-3">
                  <p className="text-xs text-warmgray font-medium">Target</p>
                  <p className="font-heading font-bold text-charcoal text-xl">
                    ${goal.revenue_target.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-heading font-bold text-charcoal mb-4">
              Targets
            </h3>
            <TargetsList targets={targets} canMarkMet={false} />
          </div>

          <div className="card">
            <h3 className="font-heading font-bold text-charcoal mb-3">
              Daily Actions ({actions.length})
            </h3>
            {actions.length > 0 ? (
              <ul className="space-y-1.5">
                {actions.map((a) => (
                  <li
                    key={a.id}
                    className="text-sm text-charcoal px-3 py-2 bg-amber-wash rounded-lg"
                  >
                    {a.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-warmgray">No daily actions set.</p>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-10">
          <p className="text-warmgray mb-3">No active goal for this client.</p>
        </div>
      )}

      <div className="card">
        <h3 className="font-heading font-bold text-charcoal mb-3">
          Recent Logs
        </h3>
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-light text-left">
                  {["Date", "Low", "Mid", "High", "Expenses", "Posts"].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-2 pr-4 text-xs text-warmgray font-medium"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 10).map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-cream last:border-0"
                  >
                    <td className="py-2 pr-4 font-medium text-charcoal">
                      {log.log_date}
                    </td>
                    <td className="py-2 pr-4 text-warmgray">
                      ${log.income_low}
                    </td>
                    <td className="py-2 pr-4 text-warmgray">
                      ${log.income_mid}
                    </td>
                    <td className="py-2 pr-4 text-warmgray">
                      ${log.income_high}
                    </td>
                    <td className="py-2 pr-4 text-red-500">
                      ${log.expenses}
                    </td>
                    <td className="py-2 pr-4 text-warmgray">
                      {log.posts_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-warmgray">No logs yet.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Set Goal Panel
// ---------------------------------------------------------------------------

function SetGoalPanel({
  clientId,
  onSaved,
}: {
  clientId: string;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    start_date: "",
    revenue_target: "",
    month1_target: "",
    month2_target: "",
    month3_target: "",
    focus_products: [] as string[],
    notes: "",
    zoom_link: "",
  });
  const [targets, setTargets] = useState<TargetInput[]>([]);

  function addTarget(type: "critical" | "major") {
    setTargets((prev) => [
      ...prev,
      { type, title: "", description: "", due_date: "" },
    ]);
  }

  function removeTarget(i: number) {
    setTargets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTarget(
    i: number,
    field: keyof TargetInput,
    value: string
  ) {
    setTargets((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t))
    );
  }

  function toggleProduct(p: string) {
    setForm((prev) => ({
      ...prev,
      focus_products: prev.focus_products.includes(p)
        ? prev.focus_products.filter((x) => x !== p)
        : [...prev.focus_products, p],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const goalRes = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        title: form.title,
        start_date: form.start_date,
        revenue_target: parseFloat(form.revenue_target),
        month1_target: form.month1_target
          ? parseFloat(form.month1_target)
          : null,
        month2_target: form.month2_target
          ? parseFloat(form.month2_target)
          : null,
        month3_target: form.month3_target
          ? parseFloat(form.month3_target)
          : null,
        focus_products: form.focus_products,
        notes: form.notes,
        zoom_link: form.zoom_link,
      }),
    });
    const goalData = await goalRes.json();

    if (targets.length > 0 && goalData.data?.id) {
      await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: goalData.data.id,
          client_id: clientId,
          targets: targets.filter((t) => t.title.trim()),
        }),
      });
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-heading font-bold text-2xl text-charcoal">
        Set 90-Day Goal
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-heading font-bold text-charcoal">Goal Details</h3>
          <div>
            <label className="label">Goal title</label>
            <input
              className="input"
              placeholder="e.g. Q2 2026 Sprint"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start date</label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, start_date: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Revenue target ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                placeholder="50000"
                value={form.revenue_target}
                onChange={(e) =>
                  setForm((p) => ({ ...p, revenue_target: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(
              ["month1_target", "month2_target", "month3_target"] as const
            ).map((key, i) => (
              <div key={key}>
                <label className="label text-xs">Month {i + 1} target ($)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <div>
            <label className="label">Focus products</label>
            <div className="flex gap-3 flex-wrap">
              {[
                ["low", "Low ticket ($7–$27)"],
                ["mid", "Mid ticket ($997–$2997)"],
                ["high", "High ticket ($6997–$9997)"],
              ].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-amber-brand"
                    checked={form.focus_products.includes(val)}
                    onChange={() => toggleProduct(val)}
                  />
                  <span className="text-sm text-charcoal">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Zoom session link</label>
            <input
              type="url"
              className="input"
              placeholder="https://zoom.us/j/..."
              value={form.zoom_link}
              onChange={(e) =>
                setForm((p) => ({ ...p, zoom_link: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-heading font-bold text-charcoal">Targets</h3>

          {targets.map((t, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border space-y-2 ${
                t.type === "critical"
                  ? "border-red-200 bg-red-50/50"
                  : "border-amber-light bg-amber-wash/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={
                    t.type === "critical" ? "badge-critical" : "badge-major"
                  }
                >
                  {t.type === "critical" ? "Critical" : "Major"}
                </span>
                <button
                  type="button"
                  onClick={() => removeTarget(i)}
                  className="text-warmgray hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <input
                className="input text-sm"
                placeholder="Target title"
                value={t.title}
                onChange={(e) => updateTarget(i, "title", e.target.value)}
              />
              <input
                className="input text-sm"
                placeholder="Description (optional)"
                value={t.description}
                onChange={(e) =>
                  updateTarget(i, "description", e.target.value)
                }
              />
              <input
                type="date"
                className="input text-sm"
                value={t.due_date}
                onChange={(e) => updateTarget(i, "due_date", e.target.value)}
              />
            </div>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => addTarget("critical")}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Add critical target
            </button>
            <button
              type="button"
              onClick={() => addTarget("major")}
              className="btn-ghost flex items-center gap-2 text-sm border border-amber-light"
            >
              <Plus size={16} /> Add major target
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="bg-[#FFAA00] text-black font-medium rounded-lg px-6 py-3 w-full text-base hover:bg-[#e69900] transition-colors disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving goal…" : "Save 90-day goal"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions Panel
// ---------------------------------------------------------------------------

interface NewActionForm {
  label: string;
  group_name: string;
  notes: string;
  link_url: string;
  target_date: string;
}

function ActionsPanel({
  clientId,
  goal,
  actions,
  setActions,
}: {
  clientId: string;
  goal: Goal | null;
  actions: DailyAction[];
  setActions: React.Dispatch<React.SetStateAction<DailyAction[]>>;
}) {
  const [saving, setSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkGroup, setBulkGroup] = useState("");
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [form, setForm] = useState<NewActionForm>({
    label: "",
    group_name: "",
    notes: "",
    link_url: "",
    target_date: "",
  });

  useEffect(() => {
    fetch("/api/admin/action-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.data ?? []))
      .catch(() => {});
  }, []);

  // Group actions by group_name
  const grouped: Record<string, DailyAction[]> = {};
  for (const action of actions) {
    const key = action.group_name ?? "__general__";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(action);
  }

  async function addAction() {
    if (!form.label.trim() || !goal) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("daily_actions")
      .insert({
        client_id: clientId,
        goal_id: goal.id,
        label: form.label.trim(),
        group_name: form.group_name.trim() || null,
        notes: form.notes.trim() || null,
        link_url: form.link_url.trim() || null,
        target_date: form.target_date || null,
        sort_order: actions.length,
        is_active: true,
      })
      .select()
      .single();
    if (data) setActions((prev) => [...prev, data as DailyAction]);
    setForm({ label: "", group_name: "", notes: "", link_url: "", target_date: "" });
    setSaving(false);
  }

  async function addBulk() {
    if (!bulkText.trim() || !goal) return;
    setSaving(true);
    const supabase = createClient();
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const rows = lines.map((label, i) => ({
      client_id: clientId,
      goal_id: goal.id,
      label,
      group_name: bulkGroup.trim() || null,
      sort_order: actions.length + i,
      is_active: true,
    }));
    const { data } = await supabase
      .from("daily_actions")
      .insert(rows)
      .select();
    if (data) setActions((prev) => [...prev, ...(data as DailyAction[])]);
    setBulkText("");
    setBulkGroup("");
    setBulkMode(false);
    setSaving(false);
  }

  async function deleteAction(id: string) {
    const supabase = createClient();
    await supabase.from("daily_actions").delete().eq("id", id);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  async function moveAction(id: string, direction: "up" | "down") {
    const idx = actions.findIndex((a) => a.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === actions.length - 1) return;
    const newActions = [...actions];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newActions[idx], newActions[swapIdx]] = [newActions[swapIdx], newActions[idx]];
    // Update sort_order values
    const updated = newActions.map((a, i) => ({ ...a, sort_order: i }));
    setActions(updated);
    // Persist in background
    const supabase = createClient();
    await Promise.all(
      updated.map((a) =>
        supabase
          .from("daily_actions")
          .update({ sort_order: a.sort_order })
          .eq("id", a.id)
      )
    );
  }

  async function loadTemplate(templateId: string) {
    if (!templateId || !goal) return;
    const res = await fetch(`/api/admin/action-templates/${templateId}/items`);
    const { data: items }: { data: ActionTemplateItem[] } = await res.json();
    if (!items?.length) return;
    const supabase = createClient();
    const rows = items.map((item, i) => ({
      client_id: clientId,
      goal_id: goal.id,
      label: item.label,
      group_name: item.group_name ?? null,
      notes: item.notes ?? null,
      link_url: item.link_url ?? null,
      sort_order: actions.length + i,
      is_active: true,
    }));
    const { data } = await supabase
      .from("daily_actions")
      .insert(rows)
      .select();
    if (data) setActions((prev) => [...prev, ...(data as DailyAction[])]);
    setSelectedTemplate("");
  }

  async function saveAsTemplate() {
    const name = window.prompt("Template name:");
    if (!name?.trim()) return;
    setSavingTemplate(true);
    const res = await fetch("/api/admin/action-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        actions: actions.map((a) => ({
          label: a.label,
          group_name: a.group_name,
          notes: a.notes,
          link_url: a.link_url,
          sort_order: a.sort_order,
        })),
      }),
    });
    if (res.ok) {
      const { data: newTemplate } = await res.json();
      if (newTemplate) setTemplates((prev) => [...prev, newTemplate]);
    }
    setSavingTemplate(false);
  }

  if (!goal) {
    return (
      <div className="card text-center py-10">
        <p className="text-warmgray">Set a 90-day goal first before adding daily actions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-2xl text-charcoal">
          Daily Actions
          <span className="ml-2 text-base font-normal text-warmgray">
            ({actions.length})
          </span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Load Template */}
          {templates.length > 0 && (
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                loadTemplate(e.target.value);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]"
            >
              <option value="">Load Template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {/* Save as Template */}
          {actions.length > 0 && (
            <button
              onClick={saveAsTemplate}
              disabled={savingTemplate}
              className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
            >
              {savingTemplate ? "Saving…" : "Save as Template"}
            </button>
          )}
          {/* Bulk Add toggle */}
          <button
            onClick={() => setBulkMode((v) => !v)}
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg px-3 py-2 transition-colors"
          >
            {bulkMode ? "Single Add" : "Bulk Add"}
          </button>
        </div>
      </div>

      {/* Grouped Actions List */}
      {actions.length === 0 ? (
        <div className="card text-center py-8 text-warmgray text-sm">
          No actions yet. Add some below.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {Object.entries(grouped).map(([groupKey, groupActions]) => (
            <div key={groupKey}>
              <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {groupKey === "__general__" ? "General" : groupKey}
              </div>
              {groupActions.map((action) => {
                const globalIdx = actions.findIndex((a) => a.id === action.id);
                return (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/40"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveAction(action.id, "up")}
                        disabled={globalIdx === 0}
                        className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveAction(action.id, "down")}
                        disabled={globalIdx === actions.length - 1}
                        className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {action.label}
                      </p>
                      {action.notes && (
                        <p className="text-xs text-warmgray truncate">
                          {action.notes}
                        </p>
                      )}
                      {action.link_url && (
                        <a
                          href={action.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#FFAA00] hover:underline truncate block"
                        >
                          {action.link_url}
                        </a>
                      )}
                    </div>
                    {action.target_date && (
                      <span className="text-xs text-warmgray shrink-0">
                        {action.target_date}
                      </span>
                    )}
                    <button
                      onClick={() => deleteAction(action.id)}
                      className="text-gray-300 hover:text-red-500 shrink-0 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {bulkMode ? (
        <div className="card space-y-3">
          <h3 className="font-heading font-bold text-charcoal">Bulk Add</h3>
          <p className="text-xs text-warmgray">
            Paste one action per line. All will be added to the same group.
          </p>
          <div>
            <label className="label text-xs">Group name (optional)</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-full"
              placeholder="e.g. Content"
              value={bulkGroup}
              onChange={(e) => setBulkGroup(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-xs">Actions (one per line)</label>
            <textarea
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-full resize-none"
              rows={6}
              placeholder={"Post 1 piece of content\nReply to 10 comments\nSend 5 DMs"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
          </div>
          <button
            onClick={addBulk}
            disabled={saving || !bulkText.trim()}
            className="bg-[#FFAA00] text-black font-medium rounded-lg px-5 py-2 text-sm hover:bg-[#e69900] transition-colors disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add All Actions"}
          </button>
        </div>
      ) : (
        <div className="card space-y-3">
          <h3 className="font-heading font-bold text-charcoal">Add Action</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label text-xs">Label *</label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-full"
                placeholder="e.g. Post 1 piece of content"
                value={form.label}
                onChange={(e) =>
                  setForm((p) => ({ ...p, label: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && addAction()}
              />
            </div>
            <div>
              <label className="label text-xs">Group name</label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-full"
                placeholder="e.g. Content"
                value={form.group_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, group_name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label text-xs">Target date</label>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-full"
                value={form.target_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, target_date: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Notes</label>
              <textarea
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-full resize-none"
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Link URL</label>
              <input
                type="url"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-full"
                placeholder="https://"
                value={form.link_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, link_url: e.target.value }))
                }
              />
            </div>
          </div>
          <button
            onClick={addAction}
            disabled={saving || !form.label.trim()}
            className="bg-[#FFAA00] text-black font-medium rounded-lg px-5 py-2 text-sm hover:bg-[#e69900] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={16} />
            {saving ? "Adding…" : "Add Action"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Products Panel
// ---------------------------------------------------------------------------

function ProductsPanel({
  clientId,
  goal,
  products,
  setProducts,
}: {
  clientId: string;
  goal: Goal | null;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Local editable rows per tier
  const [rows, setRows] = useState<Record<string, ProductRow[]>>(() => {
    const initial: Record<string, ProductRow[]> = {
      low: [],
      mid: [],
      high: [],
    };
    for (const p of products) {
      initial[p.tier] = initial[p.tier] ?? [];
      initial[p.tier].push({
        name: p.name,
        price: p.price.toString(),
        currency: p.currency.toUpperCase(),
      });
    }
    // Ensure at least one empty row per tier if none
    for (const tier of ["low", "mid", "high"]) {
      if (initial[tier].length === 0) {
        initial[tier] = [{ name: "", price: "", currency: "USD" }];
      }
    }
    return initial;
  });

  function addRow(tier: string) {
    setRows((prev) => ({
      ...prev,
      [tier]: [...prev[tier], { name: "", price: "", currency: "USD" }],
    }));
  }

  function removeRow(tier: string, idx: number) {
    setRows((prev) => ({
      ...prev,
      [tier]: prev[tier].filter((_, i) => i !== idx),
    }));
  }

  function updateRow(
    tier: string,
    idx: number,
    field: keyof ProductRow,
    value: string
  ) {
    setRows((prev) => ({
      ...prev,
      [tier]: prev[tier].map((r, i) =>
        i === idx ? { ...r, [field]: value } : r
      ),
    }));
  }

  function toggleCollapse(tier: string) {
    setCollapsed((prev) => ({ ...prev, [tier]: !prev[tier] }));
  }

  async function handleSave() {
    if (!goal) return;
    setSaving(true);
    const supabase = createClient();

    // Deactivate existing products for this goal
    await supabase
      .from("products")
      .update({ is_active: false })
      .eq("goal_id", goal.id);

    const newRows: {
      client_id: string;
      goal_id: string;
      tier: string;
      name: string;
      price: number;
      currency: string;
      is_active: boolean;
    }[] = [];

    for (const tier of ["low", "mid", "high"]) {
      for (const row of rows[tier]) {
        if (row.name.trim() && row.price) {
          newRows.push({
            client_id: clientId,
            goal_id: goal.id,
            tier,
            name: row.name.trim(),
            price: parseFloat(row.price),
            currency: row.currency.toLowerCase(),
            is_active: true,
          });
        }
      }
    }

    if (newRows.length > 0) {
      const { data } = await supabase
        .from("products")
        .insert(newRows)
        .select();
      setProducts((data as Product[] | null) ?? []);
    } else {
      setProducts([]);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!goal) {
    return (
      <div className="card text-center py-10">
        <p className="text-warmgray">Set a 90-day goal first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-heading font-bold text-2xl text-charcoal">
        Products
      </h2>

      {PRODUCT_TIERS.map((tier) => (
        <div
          key={tier.value}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          {/* Tier header */}
          <button
            type="button"
            onClick={() => toggleCollapse(tier.value)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-heading font-bold text-charcoal">
                {tier.label}
              </span>
              <span className="text-xs text-warmgray">{tier.range}</span>
            </div>
            {collapsed[tier.value] ? (
              <ChevronRight size={16} className="text-gray-400" />
            ) : (
              <CollapseIcon size={16} className="text-gray-400" />
            )}
          </button>

          {!collapsed[tier.value] && (
            <div className="px-5 pb-4 space-y-2 border-t border-gray-100 pt-3">
              {rows[tier.value].map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] flex-1"
                    placeholder="Product name"
                    value={row.name}
                    onChange={(e) =>
                      updateRow(tier.value, idx, "name", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00] w-28"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(e) =>
                      updateRow(tier.value, idx, "price", e.target.value)
                    }
                  />
                  <select
                    value={row.currency}
                    onChange={(e) =>
                      updateRow(tier.value, idx, "currency", e.target.value)
                    }
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRow(tier.value, idx)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRow(tier.value)}
                className="flex items-center gap-1.5 text-sm text-[#FFAA00] hover:text-[#e69900] font-medium transition-colors mt-1"
              >
                <Plus size={15} />
                Add Product
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[#FFAA00] text-black font-medium rounded-lg px-6 py-3 w-full text-base hover:bg-[#e69900] transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved!" : "Save Products"}
      </button>
    </div>
  );
}
