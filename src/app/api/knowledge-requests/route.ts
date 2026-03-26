import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, subject, body: messageBody } = body;

  if (!type || !subject || !messageBody) {
    return NextResponse.json(
      { error: "Missing required fields: type, subject, body" },
      { status: 400 }
    );
  }

  if (type !== "knowledge" && type !== "question") {
    return NextResponse.json(
      { error: "type must be 'knowledge' or 'question'" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("knowledge_requests").insert({
    client_id: user.id,
    type,
    subject,
    body: messageBody,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
