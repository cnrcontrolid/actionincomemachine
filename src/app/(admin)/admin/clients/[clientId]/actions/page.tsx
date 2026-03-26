"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DailyAction, Goal } from "@/types";

export default function AdminActionsPage({ params }: { params: { clientId: string } }) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("goals").select("*").eq("client_id", params.clientId).eq("status", "active").single(),
      supabase.from("daily_actions").select("*").eq("client_id", params.clientId).order("sort_order"),
    ]).then(([{ data: g }, { data: a }]) => {
      setGoal(g);
      setActions(a ?? []);
      setLoading(false);
    });
  }, [params.clientId]);

  async function addAction() {
    if (!newLabel.trim() || !goal) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("daily_actions")
      .insert({ client_id: params.clientId, goal_id: goal.id, label: newLabel.trim(), sort_order: actions.length })
      .select()
      .single();
    if (data) setActions((prev) => [...prev, data]);
    setNewLabel("");
    setSaving(false);
  }

  async function deleteAction(id: string) {
    const supabase = createClient();
    await supabase.from("daily_actions").delete().eq("id", id);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) return <div className="text-warmgray p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">Daily Actions</h1>

      {!goal ? (
        <div className="card text-center py-10">
          <p className="text-warmgray">Set a 90-day goal first before adding daily actions.</p>
        </div>
      ) : (
        <>
          <p className="text-warmgray text-sm">Goal: <span className="font-medium text-charcoal">{goal.title}</span></p>

          <div className="card space-y-3">
            <h2 className="font-heading font-bold text-charcoal">Current Actions ({actions.length})</h2>
            {actions.length === 0 ? (
              <p className="text-sm text-warmgray">No actions yet. Add some below.</p>
            ) : (
              <ul className="space-y-2">
                {actions.map((action) => (
                  <li key={action.id} className="flex items-center gap-3 px-3 py-2.5 bg-amber-wash rounded-xl">
                    <GripVertical size={16} className="text-warmgray shrink-0" />
                    <span className="flex-1 text-sm text-charcoal">{action.label}</span>
                    <button onClick={() => deleteAction(action.id)} className="text-warmgray hover:text-red-500 shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card space-y-3">
            <h2 className="font-heading font-bold text-charcoal">Add Action</h2>
            <div className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="e.g. Post 1 piece of content"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAction()}
              />
              <button onClick={addAction} disabled={saving || !newLabel.trim()} className="btn-primary flex items-center gap-2">
                <Plus size={18} />
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
