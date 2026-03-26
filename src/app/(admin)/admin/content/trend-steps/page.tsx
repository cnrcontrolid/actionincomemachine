"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TrendStep, TrendCondition } from "@/types";

const conditions: { value: TrendCondition; label: string; description: string }[] = [
  { value: "behind_pace", label: "Behind pace", description: "Revenue below linear pace to target" },
  { value: "on_pace", label: "On pace", description: "Within ±10% of target pace" },
  { value: "ahead_of_pace", label: "Ahead of pace", description: "Above linear pace" },
  { value: "no_logs_3_days", label: "No check-ins (3 days)", description: "No daily log in last 3 days" },
  { value: "critical_target_missed", label: "Critical target missed", description: "Overdue critical target" },
];

export default function AdminTrendStepsPage() {
  const [steps, setSteps] = useState<TrendStep[]>([]);
  const [activeCondition, setActiveCondition] = useState<TrendCondition>("behind_pace");
  const [form, setForm] = useState({ title: "", body: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("trend_steps").select("*").order("condition").order("sort_order").then(({ data }) => {
      setSteps(data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = steps.filter((s) => s.condition === activeCondition);

  async function addStep() {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("trend_steps")
      .insert({ condition: activeCondition, title: form.title.trim(), body: form.body.trim(), sort_order: filtered.length })
      .select()
      .single();
    if (data) setSteps((prev) => [...prev, data]);
    setForm({ title: "", body: "" });
    setSaving(false);
  }

  async function deleteStep(id: string) {
    const supabase = createClient();
    await supabase.from("trend_steps").delete().eq("id", id);
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleActive(step: TrendStep) {
    const supabase = createClient();
    await supabase.from("trend_steps").update({ is_active: !step.is_active }).eq("id", step.id);
    setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, is_active: !s.is_active } : s));
  }

  if (loading) return <div className="text-warmgray p-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-charcoal">Trend Steps</h1>
        <p className="text-warmgray mt-1 text-sm">Define action steps that clients see on their dashboard based on their income trend.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {conditions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveCondition(value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${activeCondition === value ? "bg-amber-brand text-white" : "bg-cream text-warmgray hover:bg-amber-wash"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="font-heading font-bold text-charcoal">{conditions.find((c) => c.value === activeCondition)?.label}</h2>
          <p className="text-xs text-warmgray">{conditions.find((c) => c.value === activeCondition)?.description}</p>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-warmgray">No steps for this condition yet.</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((step, i) => (
              <li key={step.id} className={`p-4 rounded-xl border ${step.is_active ? "border-amber-light bg-amber-wash/40" : "border-cream bg-cream opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-brand">Step {i + 1}</span>
                      {!step.is_active && <span className="text-xs text-warmgray">(hidden)</span>}
                    </div>
                    <p className="text-sm font-semibold text-charcoal mt-0.5">{step.title}</p>
                    <p className="text-xs text-warmgray mt-0.5">{step.body}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleActive(step)} className="text-xs text-warmgray hover:text-amber-brand">
                      {step.is_active ? "Hide" : "Show"}
                    </button>
                    <button onClick={() => deleteStep(step.id)} className="text-warmgray hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-amber-light pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-charcoal">Add new step</h3>
          <input
            className="input"
            placeholder="Step title (e.g. Post 3x per day)"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Explanation or details for this step..."
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
          />
          <button onClick={addStep} disabled={saving || !form.title.trim() || !form.body.trim()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            {saving ? "Adding..." : "Add step"}
          </button>
        </div>
      </div>
    </div>
  );
}
