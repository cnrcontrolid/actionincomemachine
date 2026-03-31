import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, description, trigger_type, trigger_days, steps } = body;

  // Support legacy single-email format
  const subject = body.subject ?? steps?.[0]?.subject;
  const html_body = body.html_body ?? steps?.[0]?.html_body;

  if (!name || !trigger_type) {
    return NextResponse.json({ error: "name and trigger_type are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_sequences")
    .insert({
      name,
      description,
      trigger_type,
      trigger_days: trigger_days ?? null,
      subject: subject ?? "",
      html_body: html_body ?? "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert email steps if provided (new multi-step format)
  if (steps && Array.isArray(steps) && steps.length > 0 && data) {
    const stepRows = steps.map((s: { subject: string; html_body: string; delay_days: number; sort_order: number }, i: number) => ({
      sequence_id: data.id,
      subject: s.subject,
      html_body: s.html_body,
      delay_days: s.delay_days ?? 0,
      sort_order: i,
    }));
    await supabase.from("email_sequence_steps").insert(stepRows);
  }

  return NextResponse.json({ ok: true, data });
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("email_sequences")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
