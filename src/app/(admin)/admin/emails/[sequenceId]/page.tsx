import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import SequenceAssignmentPanel from "@/components/admin/SequenceAssignmentPanel";
import type { EmailSequence, Profile, Goal, EmailSequenceAssignment } from "@/types";

export default async function EditSequencePage({ params }: { params: { sequenceId: string } }) {
  const supabase = createClient();

  const { data: seq } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("id", params.sequenceId)
    .single() as { data: EmailSequence | null };

  if (!seq) notFound();

  const { data: clients } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client") as { data: Profile[] | null };

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active") as { data: Goal[] | null };

  const { data: assignments } = await supabase
    .from("email_sequence_assignments")
    .select("*")
    .eq("sequence_id", params.sequenceId) as { data: EmailSequenceAssignment[] | null };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/emails" className="text-sm text-warmgray hover:text-amber-brand">← Sequences</Link>
      </div>
      <h1 className="font-heading font-bold text-3xl text-charcoal">{seq.name}</h1>

      <div className="card space-y-3">
        <h2 className="font-heading font-bold text-charcoal">Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-warmgray">Trigger:</span> <span className="text-charcoal font-medium">{seq.trigger_type}</span></div>
          {seq.trigger_days && <div><span className="text-warmgray">Day #:</span> <span className="text-charcoal font-medium">{seq.trigger_days}</span></div>}
          <div><span className="text-warmgray">Status:</span> <span className={seq.is_active ? "text-green-600 font-medium" : "text-warmgray"}>{seq.is_active ? "Active" : "Paused"}</span></div>
        </div>
        <div className="border-t border-amber-light pt-3">
          <p className="text-xs font-medium text-warmgray mb-1">Subject</p>
          <p className="text-sm text-charcoal">{seq.subject}</p>
        </div>
      </div>

      <SequenceAssignmentPanel
        sequenceId={params.sequenceId}
        clients={clients ?? []}
        goals={goals ?? []}
        existing={assignments ?? []}
      />
    </div>
  );
}
