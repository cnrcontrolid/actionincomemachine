"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { CheckCircle2, Circle, ExternalLink, Plus, Pencil, Trash2, Check, X, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import type { DailyAction, DailyActionCompletion, Goal, Project } from "@/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type Tab = "today" | "all";

interface ActionForm {
  label: string;
  group_name: string;
  notes: string;
  link_url: string;
  project_id: string;
  estimated_minutes: string;
}

const emptyActionForm: ActionForm = {
  label: "",
  group_name: "",
  notes: "",
  link_url: "",
  project_id: "",
  estimated_minutes: "",
};

export default function ActionsPage() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("today");

  // New action form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ActionForm>(emptyActionForm);
  const [addSaving, setAddSaving] = useState(false);

  // Edit action
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ActionForm>(emptyActionForm);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Collapsed projects
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const [, startTransition] = useTransition();
  const today = todayStr();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [goalRes, projectsRes, completionsRes] = await Promise.all([
      supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single(),
      supabase.from("projects").select("*").eq("client_id", user.id).eq("is_active", true).order("sort_order"),
      supabase.from("daily_action_completions").select("*").eq("client_id", user.id).eq("log_date", today),
    ]);

    const g = goalRes.data as Goal | null;
    setGoal(g);
    setProjects((projectsRes.data as Project[] | null) ?? []);

    if (g) {
      const { data: actionsData } = await supabase
        .from("daily_actions")
        .select("*")
        .eq("client_id", user.id)
        .eq("goal_id", g.id)
        .eq("is_active", true)
        .order("sort_order");
      setActions((actionsData as DailyAction[] | null) ?? []);
    }

    const compMap: Record<string, boolean> = {};
    for (const c of (completionsRes.data as DailyActionCompletion[] | null) ?? []) {
      compMap[c.action_id] = c.completed;
    }
    setCompletions(compMap);
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

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

  async function addAction(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    setAddSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get max sort_order
    const maxSort = actions.reduce((m, a) => Math.max(m, a.sort_order), 0);

    await supabase.from("daily_actions").insert({
      client_id: user.id,
      goal_id: goal.id,
      project_id: addForm.project_id || null,
      label: addForm.label,
      group_name: addForm.group_name || null,
      notes: addForm.notes || null,
      link_url: addForm.link_url || null,
      estimated_minutes: addForm.estimated_minutes ? parseInt(addForm.estimated_minutes) : null,
      sort_order: maxSort + 1,
      is_active: true,
    });

    setAddSaving(false);
    setShowAddForm(false);
    setAddForm(emptyActionForm);
    load();
  }

  function startEdit(action: DailyAction) {
    setEditingId(action.id);
    setEditForm({
      label: action.label,
      group_name: action.group_name ?? "",
      notes: action.notes ?? "",
      link_url: action.link_url ?? "",
      project_id: action.project_id ?? "",
      estimated_minutes: action.estimated_minutes?.toString() ?? "",
    });
  }

  async function saveEdit(actionId: string) {
    setEditSaving(true);
    const supabase = createClient();
    await supabase.from("daily_actions").update({
      label: editForm.label,
      group_name: editForm.group_name || null,
      notes: editForm.notes || null,
      link_url: editForm.link_url || null,
      project_id: editForm.project_id || null,
      estimated_minutes: editForm.estimated_minutes ? parseInt(editForm.estimated_minutes) : null,
    }).eq("id", actionId);
    setEditSaving(false);
    setEditingId(null);
    load();
  }

  async function deleteAction(actionId: string) {
    setDeletingId(actionId);
    const supabase = createClient();
    await supabase.from("daily_actions").update({ is_active: false }).eq("id", actionId);
    setDeletingId(null);
    setActions((prev) => prev.filter((a) => a.id !== actionId));
  }

  function toggleProjectCollapse(key: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Group actions by project
  const grouped = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const groups: { key: string; label: string; actions: DailyAction[]; projectId: string | null }[] = [];
    const seen = new Set<string>();

    for (const action of actions) {
      const pid = action.project_id ?? "__none__";
      if (!seen.has(pid)) {
        seen.add(pid);
        const proj = action.project_id ? projectMap.get(action.project_id) : null;
        groups.push({ key: pid, label: proj?.name ?? "General", actions: [], projectId: action.project_id ?? null });
      }
      groups.find((g) => g.key === pid)!.actions.push(action);
    }
    return groups;
  }, [actions, projects]);

  const completedToday = actions.filter((a) => completions[a.id]).length;
  const totalActions = actions.length;
  const actionPct = totalActions > 0 ? (completedToday / totalActions) * 100 : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-heading font-bold text-lg text-charcoal">No active goal yet</p>
          <p className="text-sm text-gray-400 mt-1">Your coach will set up your actions after your onboarding session.</p>
        </div>
      </div>
    );
  }

  const actionFormFields = (
    form: ActionForm,
    setForm: (fn: (prev: ActionForm) => ActionForm) => void
  ) => (
    <div className="space-y-2">
      <div>
        <label className="label">Action Label *</label>
        <input
          required
          value={form.label}
          onChange={(e) => setForm(p => ({ ...p, label: e.target.value }))}
          className="input"
          placeholder="What needs to be done?"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Group / Category</label>
          <input
            value={form.group_name}
            onChange={(e) => setForm(p => ({ ...p, group_name: e.target.value }))}
            className="input"
            placeholder="e.g. Marketing"
          />
        </div>
        <div>
          <label className="label">Est. Minutes</label>
          <input
            type="number"
            min="0"
            value={form.estimated_minutes}
            onChange={(e) => setForm(p => ({ ...p, estimated_minutes: e.target.value }))}
            className="input"
            placeholder="30"
          />
        </div>
      </div>
      {projects.length > 0 && (
        <div>
          <label className="label">Project</label>
          <select value={form.project_id} onChange={(e) => setForm(p => ({ ...p, project_id: e.target.value }))} className="input">
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label">Link URL</label>
        <input
          type="url"
          value={form.link_url}
          onChange={(e) => setForm(p => ({ ...p, link_url: e.target.value }))}
          className="input"
          placeholder="https://…"
        />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={2}
          className="input resize-none"
          placeholder="Optional notes…"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl h-full flex flex-col gap-4">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {([
              { key: "today", label: `Today (${completedToday}/${totalActions})` },
              { key: "all", label: "All Actions" },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={clsx(
                  "px-3 py-1 text-[12px] font-semibold rounded-md transition-all",
                  tab === key ? "bg-white text-charcoal shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#30B33C] rounded-full transition-all duration-500" style={{ width: `${actionPct}%` }} />
            </div>
            <span className="text-xs text-gray-400">{Math.round(actionPct)}%</span>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 bg-[#FFAA00] text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#e69900] transition-colors"
          >
            <Plus size={12} />
            Add Action
          </button>
        </div>
      </div>

      {/* Add action form */}
      {showAddForm && (
        <form onSubmit={addAction} className="card shrink-0 space-y-3">
          <p className="text-sm font-semibold text-charcoal">New Action</p>
          {actionFormFields(addForm, setAddForm)}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={addSaving} className="bg-[#FFAA00] text-black text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50">
              {addSaving ? "Adding…" : "Add Action"}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-sm text-gray-400 px-3">Cancel</button>
          </div>
        </form>
      )}

      {/* Action list */}
      <div className="flex-1 min-h-0 card flex flex-col p-0 overflow-hidden">
        <div className="overflow-y-auto h-full">
          {actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
              <FolderOpen size={32} className="text-gray-200" />
              <p className="text-sm text-gray-400 text-center">
                No actions yet.<br />Add your first action above.
              </p>
            </div>
          ) : tab === "today" ? (
            // TODAY VIEW: flat list, all actions for quick completion
            <ul className="p-2">
              {actions.map((action) => renderActionRow(action, completions, toggleAction, startEdit, deleteAction, deletingId, editingId, editForm, setEditForm, editSaving, saveEdit, setEditingId))}
            </ul>
          ) : (
            // ALL VIEW: grouped by project
            <div className="p-2">
              {grouped.map(({ key, label, actions: groupActions }) => {
                const collapsed = collapsedProjects.has(key);
                const groupDone = groupActions.filter((a) => completions[a.id]).length;
                return (
                  <div key={key} className="mb-2">
                    <button
                      onClick={() => toggleProjectCollapse(key)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      {collapsed ? <ChevronDown size={13} className="text-gray-300 group-hover:text-gray-500" /> : <ChevronUp size={13} className="text-gray-300 group-hover:text-gray-500" />}
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex-1 text-left">{label}</span>
                      <span className="text-[11px] text-gray-300">{groupDone}/{groupActions.length}</span>
                    </button>
                    {!collapsed && (
                      <ul>
                        {groupActions.map((action) => renderActionRow(action, completions, toggleAction, startEdit, deleteAction, deletingId, editingId, editForm, setEditForm, editSaving, saveEdit, setEditingId))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Date label */}
      <p className="shrink-0 text-xs text-gray-400 text-right">
        Completions tracked for {format(new Date(today + "T00:00:00"), "EEEE, d MMM yyyy")}
      </p>
    </div>
  );
}

function renderActionRow(
  action: DailyAction,
  completions: Record<string, boolean>,
  toggleAction: (id: string) => void,
  startEdit: (a: DailyAction) => void,
  deleteAction: (id: string) => void,
  deletingId: string | null,
  editingId: string | null,
  editForm: ActionForm,
  setEditForm: React.Dispatch<React.SetStateAction<ActionForm>>,
  editSaving: boolean,
  saveEdit: (id: string) => void,
  setEditingId: (id: string | null) => void,
) {
  const done = !!completions[action.id];
  const isEditing = editingId === action.id;
  const isDeleting = deletingId === action.id;

  if (isEditing) {
    return (
      <li key={action.id} className="bg-amber-50 rounded-xl p-3 mb-1 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="label">Label</label>
            <input value={editForm.label} onChange={(e) => setEditForm(p => ({ ...p, label: e.target.value }))} className="input text-sm" />
          </div>
          <div>
            <label className="label">Group</label>
            <input value={editForm.group_name} onChange={(e) => setEditForm(p => ({ ...p, group_name: e.target.value }))} className="input text-sm" />
          </div>
          <div>
            <label className="label">Est. Min</label>
            <input type="number" value={editForm.estimated_minutes} onChange={(e) => setEditForm(p => ({ ...p, estimated_minutes: e.target.value }))} className="input text-sm" />
          </div>
          <div className="col-span-2">
            <label className="label">Link URL</label>
            <input type="url" value={editForm.link_url} onChange={(e) => setEditForm(p => ({ ...p, link_url: e.target.value }))} className="input text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => saveEdit(action.id)} disabled={editSaving} className="bg-[#FFAA00] text-black text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">
            <Check size={11} className="inline mr-1" />Save
          </button>
          <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 px-2">
            <X size={11} className="inline mr-1" />Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li key={action.id}>
      <div className={clsx("flex items-center gap-2 px-2 py-1.5 rounded-lg group transition-colors", done ? "opacity-60" : "hover:bg-gray-50")}>
        <button onClick={() => toggleAction(action.id)} className="shrink-0">
          {done ? (
            <CheckCircle2 size={16} className="text-[#30B33C]" />
          ) : (
            <Circle size={16} className="text-gray-300" />
          )}
        </button>
        <span className={clsx("text-sm flex-1 text-left", done && "line-through text-gray-400")}>
          {action.label}
        </span>
        {action.estimated_minutes && (
          <span className="text-[10px] text-gray-300 shrink-0">{action.estimated_minutes}m</span>
        )}
        {action.link_url && (
          <a
            href={action.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-[#FFAA00] shrink-0"
          >
            <ExternalLink size={12} />
          </a>
        )}
        {/* Edit / Delete — shown on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => startEdit(action)} className="text-gray-300 hover:text-[#FFAA00] transition-colors">
            <Pencil size={12} />
          </button>
          <button
            onClick={() => { if (window.confirm("Delete this action?")) deleteAction(action.id); }}
            disabled={isDeleting}
            className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </li>
  );
}

