import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { client_id, title, start_date, revenue_target, month1_target, month2_target, month3_target, focus_products, notes, zoom_link } = body;

  // Mark previous active goal as completed
  await supabase
    .from("goals")
    .update({ status: "completed" })
    .eq("client_id", client_id)
    .eq("status", "active");

  // end_date = start_date + 89 days
  const start = new Date(start_date);
  const end = new Date(start);
  end.setDate(end.getDate() + 89);
  const end_date = end.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("goals")
    .insert({
      client_id,
      title,
      start_date,
      end_date,
      revenue_target,
      month1_target: month1_target || null,
      month2_target: month2_target || null,
      month3_target: month3_target || null,
      focus_products: focus_products ?? [],
      notes: notes || null,
      zoom_link: zoom_link || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
