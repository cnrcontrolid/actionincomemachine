import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Meta webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Meta delivery/read status updates
export async function POST(request: Request) {
  const rawBody = await request.text();

  // Verify Meta's HMAC signature
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const expected = `sha256=${crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex")}`;
    if (signature !== expected) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const body = JSON.parse(rawBody);

  try {
    const supabase = createClient();
    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const statuses = change?.value?.statuses ?? [];
        for (const status of statuses) {
          const { id: waId, status: waStatus } = status;
          if (!waId) continue;

          const mapped = waStatus === "read" ? "delivered" : waStatus; // map read→delivered
          await supabase
            .from("whatsapp_messages")
            .update({ status: mapped })
            .eq("wa_message_id", waId);
        }
      }
    }
  } catch (err) {
    console.error("[whatsapp/webhook] Error processing payload:", err);
    // Still return 200 — Meta requires it
  }

  return NextResponse.json({ ok: true });
}
