import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { goal_id, client_id, targets } = await request.json();

  const rows = targets.map((t: { type: string; title: string; description?: string; due_date?: string; sort_order?: number }, i: number) => ({
    goal_id,
    client_id,
    type: t.type,
    title: t.title,
    description: t.description ?? null,
    due_date: t.due_date ?? null,
    sort_order: t.sort_order ?? i,
  }));

  const { data, error } = await supabase.from("targets").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
