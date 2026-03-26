import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { EmailSequence } from "@/types";

export default async function AdminEmailsPage() {
  const supabase = createClient();
  const { data: sequences } = await supabase
    .from("email_sequences")
    .select("*")
    .order("created_at", { ascending: false }) as { data: EmailSequence[] | null };

  const triggerLabel: Record<string, string> = {
    days_since_start: "Day trigger",
    goal_milestone: "Milestone",
    manual: "Manual",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-charcoal">Email Sequences</h1>
        <Link href="/admin/emails/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New sequence
        </Link>
      </div>

      {(!sequences || sequences.length === 0) ? (
        <div className="card text-center py-12">
          <p className="text-warmgray">No sequences yet.</p>
          <Link href="/admin/emails/new" className="btn-primary inline-block mt-4">Create first sequence</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-light text-left">
                {["Name", "Trigger", "Day #", "Active", ""].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-xs font-semibold text-warmgray uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sequences.map((seq) => (
                <tr key={seq.id} className="border-b border-cream last:border-0 hover:bg-amber-wash/30 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-charcoal">{seq.name}</p>
                    {seq.description && <p className="text-xs text-warmgray">{seq.description}</p>}
                  </td>
                  <td className="py-3 pr-4 text-warmgray">{triggerLabel[seq.trigger_type]}</td>
                  <td className="py-3 pr-4 text-warmgray">{seq.trigger_days ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${seq.is_active ? "bg-green-100 text-green-700" : "bg-cream text-warmgray"}`}>
                      {seq.is_active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/emails/${seq.id}`} className="text-amber-brand text-xs font-medium hover:underline">Edit →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
