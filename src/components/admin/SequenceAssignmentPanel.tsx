"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Goal, EmailSequenceAssignment } from "@/types";

interface Props {
  sequenceId: string;
  clients: Profile[];
  goals: Goal[];
  existing: EmailSequenceAssignment[];
}

export default function SequenceAssignmentPanel({ sequenceId, clients, goals, existing }: Props) {
  const [assignments, setAssignments] = useState<EmailSequenceAssignment[]>(existing);
  const [saving, setSaving] = useState<string | null>(null);

  const goalMap = Object.fromEntries(goals.map((g) => [g.client_id, g]));

  async function assign(clientId: string) {
    const goal = goalMap[clientId];
    if (!goal) return;

    setSaving(clientId);
    const supabase = createClient();
    const { data } = await supabase
      .from("email_sequence_assignments")
      .upsert(
        { sequence_id: sequenceId, client_id: clientId, goal_id: goal.id, status: "pending" },
        { onConflict: "sequence_id,goal_id" }
      )
      .select()
      .single();

    if (data) {
      setAssignments((prev) => {
        const filtered = prev.filter((a) => a.client_id !== clientId);
        return [...filtered, data];
      });
    }
    setSaving(null);
  }

  async function unassign(assignmentId: string, clientId: string) {
    setSaving(clientId);
    const supabase = createClient();
    await supabase.from("email_sequence_assignments").delete().eq("id", assignmentId);
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    setSaving(null);
  }

  const statusColors: Record<string, string> = {
    pending: "text-amber-brand",
    sent: "text-green-600",
    skipped: "text-warmgray",
  };

  return (
    <div className="card space-y-4">
      <h2 className="font-heading font-bold text-charcoal">Client Assignments</h2>
      <p className="text-sm text-warmgray">Assign this sequence to clients with active goals. It will fire based on the trigger conditions.</p>

      {clients.length === 0 ? (
        <p className="text-sm text-warmgray">No clients yet.</p>
      ) : (
        <ul className="space-y-2">
          {clients.map((client) => {
            const goal = goalMap[client.id];
            const assignment = assignments.find((a) => a.client_id === client.id);

            return (
              <li key={client.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-cream">
                <div>
                  <p className="text-sm font-medium text-charcoal">{client.full_name ?? client.email}</p>
                  {goal ? (
                    <p className="text-xs text-warmgray">Goal: {goal.title}</p>
                  ) : (
                    <p className="text-xs text-red-400">No active goal</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {assignment && (
                    <span className={`text-xs font-medium ${statusColors[assignment.status]}`}>{assignment.status}</span>
                  )}
                  {goal && (
                    assignment ? (
                      <button
                        onClick={() => unassign(assignment.id, client.id)}
                        disabled={saving === client.id}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {saving === client.id ? "..." : "Remove"}
                      </button>
                    ) : (
                      <button
                        onClick={() => assign(client.id)}
                        disabled={saving === client.id}
                        className="text-xs text-amber-brand font-medium hover:underline"
                      >
                        {saving === client.id ? "..." : "Assign"}
                      </button>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
