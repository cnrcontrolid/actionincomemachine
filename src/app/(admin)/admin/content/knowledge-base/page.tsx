"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { KnowledgeResource, KnowledgeCategory } from "@/types";

const categories: { value: KnowledgeCategory; label: string }[] = [
  { value: "mindset", label: "Mindset" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "tech", label: "Tech" },
  { value: "strategy", label: "Strategy" },
];

export default function AdminKnowledgeBasePage() {
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", url: "", category: "sales" as KnowledgeCategory });

  useEffect(() => {
    const supabase = createClient();
    supabase.from("knowledge_resources").select("*").order("sort_order").then(({ data }) => {
      setResources(data ?? []);
      setLoading(false);
    });
  }, []);

  async function addResource() {
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("knowledge_resources")
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        url: form.url.trim(),
        category: form.category,
        sort_order: resources.length,
        is_published: true,
      })
      .select()
      .single();
    if (data) setResources((prev) => [...prev, data]);
    setForm({ title: "", description: "", url: "", category: "sales" });
    setSaving(false);
  }

  async function togglePublished(resource: KnowledgeResource) {
    const supabase = createClient();
    await supabase.from("knowledge_resources").update({ is_published: !resource.is_published }).eq("id", resource.id);
    setResources((prev) => prev.map((r) => r.id === resource.id ? { ...r, is_published: !r.is_published } : r));
  }

  async function deleteResource(id: string) {
    const supabase = createClient();
    await supabase.from("knowledge_resources").delete().eq("id", id);
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <div className="text-warmgray p-8">Loading...</div>;

  const catLabel = Object.fromEntries(categories.map((c) => [c.value, c.label]));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-charcoal">Knowledge Base</h1>
        <p className="text-warmgray mt-1 text-sm">Add resources, links, and tools for your clients to access from their dashboard.</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-heading font-bold text-charcoal">Add Resource</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. The Sell Like Crazy Book" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">URL</label>
            <input type="url" className="input" placeholder="https://..." value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as KnowledgeCategory }))}>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input className="input" placeholder="Brief description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
        <button onClick={addResource} disabled={saving || !form.title.trim() || !form.url.trim()} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          {saving ? "Adding..." : "Add resource"}
        </button>
      </div>

      <div className="card space-y-3">
        <h2 className="font-heading font-bold text-charcoal">All Resources ({resources.length})</h2>
        {resources.length === 0 ? (
          <p className="text-sm text-warmgray">No resources yet.</p>
        ) : (
          <ul className="space-y-2">
            {resources.map((r) => (
              <li key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${r.is_published ? "border-amber-light" : "border-cream opacity-60"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-charcoal truncate">{r.title}</p>
                    <span className="text-xs bg-cream text-warmgray px-1.5 py-0.5 rounded-full shrink-0">{catLabel[r.category]}</span>
                  </div>
                  <p className="text-xs text-warmgray truncate">{r.url}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => togglePublished(r)} className="text-warmgray hover:text-amber-brand" title={r.is_published ? "Hide" : "Publish"}>
                    {r.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => deleteResource(r.id)} className="text-warmgray hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
