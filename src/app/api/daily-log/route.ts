import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const goal_id = searchParams.get("goal_id");
  const log_date = searchParams.get("log_date");

  if (!goal_id || !log_date) {
    return NextResponse.json({ error: "Missing goal_id or log_date" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("client_id", user.id)
    .eq("goal_id", goal_id)
    .eq("log_date", log_date)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    goal_id,
    log_date,
    income_low = 0,
    income_mid = 0,
    income_high = 0,
    income_total,
    money_in_bank,
    expenses = 0,
    posts_count = 0,
    emails_count = 0,
    sales_calls_count,
    notes = "",
  } = body;

  const { data, error } = await supabase
    .from("daily_logs")
    .upsert(
      {
        client_id: user.id,
        goal_id,
        log_date,
        income_low,
        income_mid,
        income_high,
        ...(income_total !== undefined && { income_total }),
        ...(money_in_bank !== undefined && { money_in_bank }),
        ...(sales_calls_count !== undefined && { sales_calls_count }),
        expenses,
        posts_count,
        emails_count,
        notes,
      },
      { onConflict: "client_id,log_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
