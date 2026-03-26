const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export interface WAResult {
  messageId: string | null;
  error: string | null;
}

export async function sendWhatsAppText(phone: string, message: string): Promise<WAResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone, // E.164 format e.g. +19876543210
      type: "text",
      text: { body: message, preview_url: false },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      messageId: null,
      error: data?.error?.message ?? `HTTP ${res.status}`,
    };
  }

  return {
    messageId: data?.messages?.[0]?.id ?? null,
    error: null,
  };
}
