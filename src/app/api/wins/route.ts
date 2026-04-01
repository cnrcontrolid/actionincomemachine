import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const goal_id = searchParams.get("goal_id");

  let query = supabase
    .from("wins")
    .select("*")
    .eq("client_id", user.id)
    .order("win_date", { ascending: false })
    .limit(100);

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
  const { goal_id, win_date, description, rating } = body;

  if (!win_date || !description) {
    return NextResponse.json({ error: "win_date and description required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("wins")
    .insert({
      client_id: user.id,
      goal_id: goal_id ?? null,
      win_date,
      description,
      rating: rating ?? 3,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
