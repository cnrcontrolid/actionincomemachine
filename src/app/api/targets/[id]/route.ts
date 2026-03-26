import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { replaceTokens } from "@/lib/email-tokens";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { is_met } = await request.json();

  const { data: target, error } = await supabase
    .from("targets")
    .update({ is_met, met_at: is_met ? new Date().toISOString() : null })
    .eq("id", params.id)
    .select("*, goals(*), profiles:client_id(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire goal_milestone email sequences immediately if target was met
  if (is_met && target) {
    const goal = target.goals as { id: string; start_date: string; revenue_target: number; title: string };
    const clientProfile = target.profiles as { id: string; full_name: string | null; email: string };

    const { data: assignments } = await supabase
      .from("email_sequence_assignments")
      .select("*, email_sequences(*)")
      .eq("client_id", clientProfile.id)
      .eq("goal_id", goal.id)
      .eq("status", "pending");

    for (const assignment of assignments ?? []) {
      const seq = assignment.email_sequences as { trigger_type: string; subject: string; html_body: string; is_active: boolean };
      if (seq.trigger_type !== "goal_milestone" || !seq.is_active) continue;

      // Compute revenue to date
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("income_low, income_mid, income_high")
        .eq("client_id", clientProfile.id)
        .eq("goal_id", goal.id);

      const revenueToDate = (logs ?? []).reduce(
        (s: number, l: { income_low: number; income_mid: number; income_high: number }) => s + l.income_low + l.income_mid + l.income_high, 0
      );

      const html = replaceTokens(seq.html_body, {
        client_name: clientProfile.full_name ?? clientProfile.email,
        goal_title: goal.title,
        revenue_to_date: `$${revenueToDate.toLocaleString()}`,
        revenue_target: `$${goal.revenue_target.toLocaleString()}`,
        percent_complete: `${Math.round((revenueToDate / goal.revenue_target) * 100)}%`,
        day_number: String(
          Math.max(1, Math.ceil((Date.now() - new Date(goal.start_date).getTime()) / 86400000) + 1)
        ),
        days_remaining: "—",
      });

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: clientProfile.email,
        subject: replaceTokens(seq.subject, { client_name: clientProfile.full_name ?? "" }),
        html,
      });

      await supabase
        .from("email_sequence_assignments")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", assignment.id);
    }
  }

  return NextResponse.json({ ok: true, data: target });
}
