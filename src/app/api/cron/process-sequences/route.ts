import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { replaceTokens } from "@/lib/email-tokens";
import { getDayNumber, getDaysRemaining, getRevenueTotal } from "@/lib/goal-calculations";
import { NextResponse } from "next/server";
import type { DailyLog } from "@/types";

export async function GET(request: Request) {
  // Protect the cron endpoint
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch all pending assignments with sequence + goal + client data
  const { data: assignments, error } = await supabase
    .from("email_sequence_assignments")
    .select(`
      *,
      email_sequences (*),
      goals (*),
      profiles:client_id (*)
    `)
    .eq("status", "pending")
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;

  for (const assignment of assignments ?? []) {
    const seq = assignment.email_sequences as {
      trigger_type: string;
      trigger_days: number | null;
      subject: string;
      html_body: string;
      is_active: boolean;
    };
    const goal = assignment.goals as {
      id: string;
      start_date: string;
      end_date: string;
      revenue_target: number;
      title: string;
    };
    const client = assignment.profiles as {
      id: string;
      email: string;
      full_name: string | null;
    };

    if (!seq?.is_active) continue;
    if (seq.trigger_type !== "days_since_start") continue;
    if (seq.trigger_days == null) continue;

    // Check if today is the right day
    const dayNum = getDayNumber(goal.start_date);
    if (dayNum !== seq.trigger_days) continue;

    // Compute revenue to date
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("income_low, income_mid, income_high")
      .eq("client_id", client.id)
      .eq("goal_id", goal.id);

    const revenueToDate = getRevenueTotal((logs ?? []) as DailyLog[]);
    const daysRemaining = getDaysRemaining(goal.end_date);

    const tokenData: Record<string, string> = {
      client_name: client.full_name ?? client.email,
      goal_title: goal.title,
      day_number: String(dayNum),
      days_remaining: String(daysRemaining),
      revenue_to_date: `$${revenueToDate.toLocaleString()}`,
      revenue_target: `$${goal.revenue_target.toLocaleString()}`,
      percent_complete: `${Math.round((revenueToDate / goal.revenue_target) * 100)}%`,
    };

    const html = replaceTokens(seq.html_body, tokenData);
    const subject = replaceTokens(seq.subject, tokenData);

    const { error: sendError } = await sendEmail({ to: client.email, subject, html });

    await supabase
      .from("email_sequence_assignments")
      .update({
        status: sendError ? "skipped" : "sent",
        sent_at: sendError ? null : new Date().toISOString(),
      })
      .eq("id", assignment.id);

    if (!sendError) processed++;
  }

  return NextResponse.json({ ok: true, processed, date: today });
}
