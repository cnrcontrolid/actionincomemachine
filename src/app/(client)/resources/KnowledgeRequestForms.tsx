"use client";

import { useState } from "react";

type FormType = "knowledge" | "question";

function RequestForm({ type, title, description }: { type: FormType; title: string; description: string }) {
  const [form, setForm] = useState({ subject: "", body: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    setStatus("saving");
    const res = await fetch("/api/knowledge-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, subject: form.subject, body: form.body }),
    });
    if (res.ok) {
      setStatus("done");
      setForm({ subject: "", body: "" });
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="card">
      <h3 className="font-heading font-bold text-charcoal text-lg mb-1">{title}</h3>
      <p className="text-sm text-warmgray mb-4">{description}</p>

      {status === "done" ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-green-700">
            Submitted! Your coach will review it soon.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="text-xs text-green-600 underline mt-1"
          >
            Submit another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              className="input"
              placeholder={type === "knowledge" ? "e.g. How to close high-ticket clients" : "e.g. What's the best time to follow up?"}
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Details</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Provide more context…"
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              required
            />
          </div>
          {status === "error" && (
            <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
          )}
          <button
            type="submit"
            disabled={status === "saving"}
            className="w-full bg-[#FFAA00] hover:bg-[#e69900] text-black font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {status === "saving" ? "Submitting…" : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function KnowledgeRequestForms() {
  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-charcoal text-xl">Ask Your Coach</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RequestForm
          type="knowledge"
          title="Request New Knowledge"
          description="Ask your coach to add a resource, guide, or training on a specific topic."
        />
        <RequestForm
          type="question"
          title="Submit a Question"
          description="Have a burning question? Your coach will get back to you directly."
        />
      </div>
    </div>
  );
}
