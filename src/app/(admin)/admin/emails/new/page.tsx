"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_REFERENCE } from "@/lib/email-tokens";

export default function NewSequencePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger_type: "days_since_start",
    trigger_days: "",
    subject: "",
    html_body: "",
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/email/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        trigger_days: form.trigger_days ? parseInt(form.trigger_days) : null,
      }),
    });
    router.push("/admin/emails");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">New Email Sequence</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-heading font-bold text-charcoal">Sequence Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Sequence name</label>
              <input className="input" placeholder="e.g. Welcome Series" {...field("name")} required />
            </div>
            <div className="col-span-2">
              <label className="label">Description (optional)</label>
              <input className="input" {...field("description")} />
            </div>
            <div>
              <label className="label">Trigger type</label>
              <select className="input" {...field("trigger_type")}>
                <option value="days_since_start">Day since goal start</option>
                <option value="goal_milestone">Goal milestone met</option>
                <option value="manual">Manual (send on demand)</option>
              </select>
            </div>
            {form.trigger_type === "days_since_start" && (
              <div>
                <label className="label">Send on day #</label>
                <input type="number" className="input" min="1" max="90" placeholder="1" {...field("trigger_days")} />
              </div>
            )}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-heading font-bold text-charcoal">Email Content</h2>
          <div>
            <label className="label">Subject line</label>
            <input className="input" placeholder="Hi {{client_name}}, Day {{day_number}} check-in" {...field("subject")} required />
          </div>
          <div>
            <label className="label">HTML body</label>
            <textarea className="input font-mono text-xs resize-none" rows={12} placeholder="<p>Hi {{client_name}},</p>..." {...field("html_body")} required />
          </div>
          <div className="bg-amber-wash rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal mb-2">Available tokens:</p>
            <div className="grid grid-cols-2 gap-1">
              {TOKEN_REFERENCE.map((t) => (
                <div key={t.token} className="text-xs">
                  <code className="text-amber-brand font-mono">{t.token}</code>
                  <span className="text-warmgray ml-1">— {t.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full text-base" disabled={saving}>
          {saving ? "Saving..." : "Create sequence"}
        </button>
      </form>
    </div>
  );
}
