"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";

interface TemplateItem {
  id: string;
  label: string;
  group_name: string | null;
  notes: string | null;
  link_url: string | null;
  sort_order: number;
}

interface ActionTemplate {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  action_template_items: TemplateItem[];
}

export default function AdminResourcesPage() {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/action-templates")
      .then((r) => r.json())
      .then((d) => { setTemplates(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteTemplate(id: string) {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/action-templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  }

  if (loading) return <div className="text-warmgray p-8">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-charcoal">Resources</h1>
        <p className="text-warmgray text-sm mt-1">Manage reusable action templates and email templates.</p>
      </div>

      {/* Action Templates section */}
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-xl text-charcoal">Action Templates</h2>
        <p className="text-sm text-warmgray">
          Templates created via &quot;Save as Template&quot; on a client&apos;s Actions tab. Load them when setting up new clients.
        </p>

        {templates.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-warmgray text-sm">No action templates yet.</p>
            <p className="text-xs text-warmgray mt-1">Go to a client → Daily Actions tab → Save as Template.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tpl) => {
              const isOpen = expanded.has(tpl.id);
              return (
                <div key={tpl.id} className="card p-0 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpand(tpl.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-charcoal">{tpl.name}</p>
                      {tpl.description && <p className="text-xs text-warmgray mt-0.5">{tpl.description}</p>}
                      <p className="text-xs text-warmgray mt-0.5">{tpl.action_template_items?.length ?? 0} actions</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id); }}
                        disabled={deleting === tpl.id}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                      {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && tpl.action_template_items?.length > 0 && (
                    <div className="border-t border-gray-100">
                      {tpl.action_template_items
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((item) => (
                          <div key={item.id} className="flex items-start gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-charcoal">{item.label}</p>
                              {item.group_name && <p className="text-xs text-warmgray">{item.group_name}</p>}
                              {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                              {item.link_url && (
                                <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FFAA00] hover:underline">{item.link_url}</a>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
