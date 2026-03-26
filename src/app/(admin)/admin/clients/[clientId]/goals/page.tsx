"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

interface TargetInput {
  type: "critical" | "major";
  title: string;
  description: string;
  due_date: string;
}

export default function AdminSetGoalPage({ params }: { params: { clientId: string } }) {
  const router = useRouter();
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
    setTargets((prev) => [...prev, { type, title: "", description: "", due_date: "" }]);
  }

  function removeTarget(i: number) {
    setTargets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTarget(i: number, field: keyof TargetInput, value: string) {
    setTargets((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
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
        client_id: params.clientId,
        title: form.title,
        start_date: form.start_date,
        revenue_target: parseFloat(form.revenue_target),
        month1_target: form.month1_target ? parseFloat(form.month1_target) : null,
        month2_target: form.month2_target ? parseFloat(form.month2_target) : null,
        month3_target: form.month3_target ? parseFloat(form.month3_target) : null,
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
          client_id: params.clientId,
          targets: targets.filter((t) => t.title.trim()),
        }),
      });
    }

    setSaving(false);
    router.push(`/admin/clients/${params.clientId}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">Set 90-Day Goal</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-heading font-bold text-charcoal">Goal Details</h2>
          <div>
            <label className="label">Goal title</label>
            <input className="input" placeholder="e.g. Q2 2026 Sprint" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Revenue target ($)</label>
              <input type="number" className="input" min="0" placeholder="50000" value={form.revenue_target} onChange={(e) => setForm((p) => ({ ...p, revenue_target: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["month1_target", "month2_target", "month3_target"].map((key, i) => (
              <div key={key}>
                <label className="label text-xs">Month {i + 1} target ($)</label>
                <input type="number" className="input" min="0" value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div>
            <label className="label">Focus products</label>
            <div className="flex gap-3 flex-wrap">
              {[["low", "Low ticket ($7–$27)"], ["mid", "Mid ticket ($997–$2997)"], ["high", "High ticket ($6997–$9997)"]].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-amber-brand" checked={form.focus_products.includes(val)}
                    onChange={() => toggleProduct(val)} />
                  <span className="text-sm text-charcoal">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Zoom session link</label>
            <input type="url" className="input" placeholder="https://zoom.us/j/..." value={form.zoom_link} onChange={(e) => setForm((p) => ({ ...p, zoom_link: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-heading font-bold text-charcoal">Targets</h2>

          {targets.map((t, i) => (
            <div key={i} className={`p-4 rounded-xl border space-y-2 ${t.type === "critical" ? "border-red-200 bg-red-50/50" : "border-amber-light bg-amber-wash/40"}`}>
              <div className="flex items-center justify-between">
                <span className={t.type === "critical" ? "badge-critical" : "badge-major"}>{t.type === "critical" ? "Critical" : "Major"}</span>
                <button type="button" onClick={() => removeTarget(i)} className="text-warmgray hover:text-red-500"><Trash2 size={16} /></button>
              </div>
              <input className="input text-sm" placeholder="Target title" value={t.title} onChange={(e) => updateTarget(i, "title", e.target.value)} />
              <input className="input text-sm" placeholder="Description (optional)" value={t.description} onChange={(e) => updateTarget(i, "description", e.target.value)} />
              <input type="date" className="input text-sm" value={t.due_date} onChange={(e) => updateTarget(i, "due_date", e.target.value)} />
            </div>
          ))}

          <div className="flex gap-3">
            <button type="button" onClick={() => addTarget("critical")} className="btn-secondary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add critical target
            </button>
            <button type="button" onClick={() => addTarget("major")} className="btn-ghost flex items-center gap-2 text-sm border border-amber-light">
              <Plus size={16} /> Add major target
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full text-base" disabled={saving}>
          {saving ? "Saving goal..." : "Save 90-day goal"}
        </button>
      </form>
    </div>
  );
}
