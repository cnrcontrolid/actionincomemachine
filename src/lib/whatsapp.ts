const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

// Template: "coaching_update"
// Body: "Hey {{1}}, \n{{2}}\nYour Action Income Coach\nChinmai"
// {{1}} = client first name, {{2}} = message body
const TEMPLATE_NAME = "coaching_update";
const TEMPLATE_LANGUAGE = "en_GB";

export interface WAResult {
  messageId: string | null;
  error: string | null;
}

async function callApi(phoneNumberId: string, accessToken: string, body: object): Promise<WAResult> {
  const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    return { messageId: null, error: data?.error?.message ?? `HTTP ${res.status}` };
  }
  return { messageId: data?.messages?.[0]?.id ?? null, error: null };
}

// Send using the approved coaching_update template (works for initiating conversations)
export async function sendWhatsAppTemplate(
  phone: string,
  clientName: string,
  message: string
): Promise<WAResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  return callApi(phoneNumberId!, accessToken!, {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: TEMPLATE_NAME,
      language: { code: TEMPLATE_LANGUAGE },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: clientName },
            { type: "text", text: message },
          ],
        },
      ],
    },
  });
}

// Fallback: free-form text (only works within 24h conversation window)
export async function sendWhatsAppText(phone: string, message: string): Promise<WAResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  return callApi(phoneNumberId!, accessToken!, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "text",
    text: { body: message, preview_url: false },
  });
}
