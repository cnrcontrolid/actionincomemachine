import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { replaceTokens } from "@/lib/email-tokens";
import { getRevenueTotal, getDayNumber, getDaysRemaining } from "@/lib/goal-calculations";
import { NextResponse } from "next/server";
import type { DailyLog } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { is_met: rawIsMet } = await request.json();
  const is_met = Boolean(rawIsMet);

  const { data: target, error } = await supabase
    .from("targets")
    .update({ is_met, met_at: is_met ? new Date().toISOString() : null })
    .eq("id", params.id)
    .select("*, goals(*), profiles:client_id(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire goal_milestone email sequences immediately if target was met
  if (is_met && target) {
    const goal = target.goals as { id: string; start_date: string; end_date: string; revenue_target: number; title: string };
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

      const revenueToDate = getRevenueTotal((logs ?? []) as DailyLog[]);
      const dayNum = getDayNumber(goal.start_date);
      const daysRemaining = getDaysRemaining(goal.end_date);

      const html = replaceTokens(seq.html_body, {
        client_name: clientProfile.full_name ?? clientProfile.email,
        goal_title: goal.title,
        revenue_to_date: `$${revenueToDate.toLocaleString()}`,
        revenue_target: `$${goal.revenue_target.toLocaleString()}`,
        percent_complete: `${Math.round((revenueToDate / goal.revenue_target) * 100)}%`,
        day_number: String(dayNum),
        days_remaining: String(daysRemaining),
      });

      await sendEmail({
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
