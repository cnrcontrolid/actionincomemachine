import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}

const LOGO_URL = "https://app.actionincomemachine.com/logo.png";

function withLogoHeader(html: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1F1F1F;padding:20px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <img src="${LOGO_URL}" alt="Action Income Machine" height="48" style="height:48px;" onerror="this.style.display='none'" />
        <p style="color:#FFAA00;font-weight:700;font-size:18px;margin:8px 0 0;">Action Income Machine</p>
      </div>
      <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        ${html}
      </div>
    </div>
  `;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@actionincomemachine.com",
    to,
    subject,
    html: withLogoHeader(html),
  });
}
