import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { client_id, subject, html_body } = await request.json();

  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", client_id)
    .single();

  if (!clientProfile?.email) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { error } = await sendEmail({ to: clientProfile.email, subject, html: html_body });
  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
