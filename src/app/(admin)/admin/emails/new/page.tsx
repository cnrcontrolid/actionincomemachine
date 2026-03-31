"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_REFERENCE } from "@/lib/email-tokens";
import RichEmailEditor from "@/components/admin/RichEmailEditor";
import { Plus, Trash2, ChevronUp, ChevronDown, Save } from "lucide-react";

interface EmailStep {
  id: string;
  subject: string;
  html_body: string;
  delay_days: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_body: string;
}

function newStep(delay = 0): EmailStep {
  return { id: crypto.randomUUID(), subject: "", html_body: "", delay_days: delay };
}

export default function NewSequencePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger_type: "days_since_start",
    trigger_days: "",
  });
  const [steps, setSteps] = useState<EmailStep[]>([newStep(0)]);
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const [lastFocused, setLastFocused] = useState<"subject" | "body">("body");

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.data ?? []))
      .catch(() => {});
  }, []);

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  function updateStep(idx: number, field: keyof EmailStep, value: string | number) {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function addStep() {
    const lastDelay = steps[steps.length - 1]?.delay_days ?? 0;
    setSteps((prev) => [...prev, newStep(lastDelay + 1)]);
    setActiveStep(steps.length);
  }

  function removeStep(idx: number) {
    if (steps.length === 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== idx));
    setActiveStep(Math.min(activeStep, steps.length - 2));
  }

  function moveStep(idx: number, dir: "up" | "down") {
    const newSteps = [...steps];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= steps.length) return;
    [newSteps[idx], newSteps[swap]] = [newSteps[swap], newSteps[idx]];
    setSteps(newSteps);
    setActiveStep(swap);
  }

  // Insert token at cursor (subject) or fire event for editor (body)
  function insertToken(token: string) {
    if (lastFocused === "subject" && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + token + el.value.slice(end);
      updateStep(activeStep, "subject", newVal);
      setTimeout(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); }, 0);
    } else {
      document.dispatchEvent(new CustomEvent("insert-email-token", { detail: token }));
    }
  }

  // Load a saved template into the active step
  function loadTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    updateStep(activeStep, "subject", tpl.subject);
    updateStep(activeStep, "html_body", tpl.html_body);
  }

  // Save active step as template
  async function saveAsTemplate() {
    const step = steps[activeStep];
    const name = window.prompt("Template name:");
    if (!name?.trim() || !step.subject || !step.html_body) return;
    setSavingTemplate(true);
    const res = await fetch("/api/admin/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), subject: step.subject, html_body: step.html_body }),
    });
    if (res.ok) {
      const { data } = await res.json();
      if (data) setTemplates((prev) => [...prev, data]);
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 2500);
    }
    setSavingTemplate(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || steps.some((s) => !s.subject.trim() || !s.html_body.trim())) return;
    setSaving(true);
    await fetch("/api/email/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        trigger_days: form.trigger_days ? parseInt(form.trigger_days) : null,
        steps: steps.map((s, i) => ({
          subject: s.subject,
          html_body: s.html_body,
          delay_days: s.delay_days,
          sort_order: i,
        })),
      }),
    });
    router.push("/admin/emails");
  }

  const currentStep = steps[activeStep];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">New Email Sequence</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sequence settings */}
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

        {/* Email steps */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-charcoal">Email Steps ({steps.length})</h2>
            <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-sm text-[#FFAA00] font-medium hover:text-[#e69900]">
              <Plus size={15} /> Add Step
            </button>
          </div>

          {/* Step tabs */}
          <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeStep === idx ? "bg-[#FFAA00] text-black" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  Step {idx + 1} {step.delay_days > 0 ? `(+${step.delay_days}d)` : "(send)"}
                </button>
                <div className="flex flex-col gap-0">
                  <button type="button" onClick={() => moveStep(idx, "up")} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 p-0.5"><ChevronUp size={12} /></button>
                  <button type="button" onClick={() => moveStep(idx, "down")} disabled={idx === steps.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 p-0.5"><ChevronDown size={12} /></button>
                </div>
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(idx)} className="text-gray-300 hover:text-red-500 p-0.5"><Trash2 size={12} /></button>
                )}
              </div>
            ))}
          </div>

          {/* Active step editor */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="label">Subject line</label>
                <input
                  ref={subjectRef}
                  className="input"
                  placeholder="Hi {{first_name}}, Day {{day_number}} check-in"
                  value={currentStep.subject}
                  onChange={(e) => updateStep(activeStep, "subject", e.target.value)}
                  onFocus={() => setLastFocused("subject")}
                  required
                />
              </div>
              <div className="w-36">
                <label className="label">Send delay (days)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={currentStep.delay_days}
                  onChange={(e) => updateStep(activeStep, "delay_days", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Email body</label>
                <div className="flex items-center gap-2">
                  {templates.length > 0 && (
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FFAA00]"
                      defaultValue=""
                      onChange={(e) => { loadTemplate(e.target.value); e.target.value = ""; }}
                    >
                      <option value="" disabled>Load template…</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={saveAsTemplate}
                    disabled={savingTemplate}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#FFAA00] border border-gray-200 rounded-lg px-2 py-1 transition-colors"
                  >
                    <Save size={11} /> {templateSaved ? "Saved!" : "Save as template"}
                  </button>
                </div>
              </div>
              <div onFocus={() => setLastFocused("body")}>
                <RichEmailEditor
                  value={currentStep.html_body}
                  onChange={(html) => updateStep(activeStep, "html_body", html)}
                />
              </div>
            </div>

            {/* Custom Fields (formerly "Available tokens") */}
            <div className="bg-amber-wash rounded-xl p-4">
              <p className="text-xs font-semibold text-charcoal mb-2">Custom Fields — click to insert</p>
              <div className="flex flex-wrap gap-2">
                {TOKEN_REFERENCE.map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    onClick={() => insertToken(t.token)}
                    title={t.description}
                    className="text-xs bg-white border border-amber-light text-amber-brand font-mono px-2 py-1 rounded-lg hover:bg-[#FFAA00] hover:text-white hover:border-[#FFAA00] transition-colors"
                  >
                    {t.token}
                  </button>
                ))}
              </div>
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
