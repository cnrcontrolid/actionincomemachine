import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action_id, log_date, completed } = await request.json();

  const { error } = await supabase
    .from("daily_action_completions")
    .upsert(
      { action_id, client_id: user.id, log_date, completed },
      { onConflict: "action_id,log_date" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
