import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const goal_id = searchParams.get("goal_id");

  let query = supabase
    .from("projects")
    .select("*")
    .eq("client_id", user.id)
    .eq("is_active", true)
    .order("sort_order");

  if (goal_id) query = query.eq("goal_id", goal_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { goal_id, name, description, estimated_hours, sort_order } = body;

  if (!goal_id || !name) {
    return NextResponse.json({ error: "goal_id and name required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: user.id,
      goal_id,
      name,
      description: description ?? null,
      estimated_hours: estimated_hours ?? null,
      sort_order: sort_order ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
