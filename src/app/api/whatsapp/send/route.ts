import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { recipients, message } = await request.json() as {
    recipients: { phone: string; client_id?: string }[];
    message: string;
  };

  const results = await Promise.all(
    recipients.map(async ({ phone, client_id }) => {
      const result = await sendWhatsAppText(phone, message);

      // Log to DB
      await supabase.from("whatsapp_messages").insert({
        sender_id: user.id,
        recipient_id: client_id ?? null,
        recipient_phone: phone,
        message_body: message,
        wa_message_id: result.messageId,
        status: result.error ? "failed" : "sent",
        error_detail: result.error,
        sent_at: result.error ? null : new Date().toISOString(),
      });

      return { phone, ...result };
    })
  );

  return NextResponse.json({ ok: true, results });
}
