import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  // Verify the log belongs to the authenticated user
  const { data: existingLog, error: fetchError } = await supabase
    .from("daily_logs")
    .select("id, client_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingLog) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  if (existingLog.client_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    income_total,
    money_in_bank,
    expenses,
    posts_count,
    sales_calls_count,
    notes,
  } = body;

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (income_total !== undefined) updates.income_total = income_total;
  if (money_in_bank !== undefined) updates.money_in_bank = money_in_bank;
  if (expenses !== undefined) updates.expenses = expenses;
  if (posts_count !== undefined) updates.posts_count = posts_count;
  if (sales_calls_count !== undefined) updates.sales_calls_count = sales_calls_count;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("daily_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
