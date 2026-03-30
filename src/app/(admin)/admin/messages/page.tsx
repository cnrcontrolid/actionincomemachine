"use client";

import { useState, useEffect } from "react";
import { Send, Users, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, WhatsAppMessage } from "@/types";

export default function AdminMessagesPage() {
  const [clients, setClients] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [broadcast, setBroadcast] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("profiles").select("*").eq("role", "client").eq("whatsapp_opt_in", true).order("full_name"),
      supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: false }).limit(20),
    ]).then(([{ data: c }, { data: m }]) => {
      setClients(c ?? []);
      setMessages(m ?? []);
    });
  }, []);

  function toggleClient(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    const recipients = broadcast
      ? clients.filter((c) => c.phone).map((c) => ({ phone: c.phone!, client_id: c.id }))
      : clients.filter((c) => selected.includes(c.id) && c.phone).map((c) => ({ phone: c.phone!, client_id: c.id }));

    if (recipients.length === 0) {
      setResult("No recipients with phone numbers selected.");
      return;
    }

    setSending(true);
    setResult(null);
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients, message }),
    });
    const data = await res.json();
    setSending(false);
    setResult(`Sent to ${data.results?.filter((r: { error: string | null }) => !r.error).length ?? 0} recipients.`);
    setMessage("");
    setSelected([]);
  }

  const statusColors: Record<string, string> = {
    sent: "text-green-600", delivered: "text-green-700", failed: "text-red-500", queued: "text-warmgray",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">WhatsApp Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div className="flex gap-3">
            <button onClick={() => { setBroadcast(false); setSelected([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!broadcast ? "bg-amber-brand text-white" : "bg-cream text-warmgray"}`}>
              <User size={16} /> Individual
            </button>
            <button onClick={() => { setBroadcast(true); setSelected([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${broadcast ? "bg-amber-brand text-white" : "bg-cream text-warmgray"}`}>
              <Users size={16} /> Broadcast
            </button>
          </div>

          {!broadcast && (
            <div>
              <label className="label">Select clients</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {clients.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-cream cursor-pointer">
                    <input type="checkbox" className="accent-amber-brand" checked={selected.includes(c.id)} onChange={() => toggleClient(c.id)} />
                    <span className="text-sm text-charcoal flex-1">{c.full_name ?? c.email}</span>
                    {!c.phone && <span className="text-xs text-red-400">No phone</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {broadcast && (
            <p className="text-sm text-warmgray bg-amber-wash rounded-xl px-4 py-3">
              Sending to all {clients.filter((c) => c.phone).length} clients who have WhatsApp opt-in and a phone number.
            </p>
          )}

          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="label">Message</label>
              <textarea className="input resize-none" rows={4} placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            {result && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{result}</p>}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={sending}>
              <Send size={16} />
              {sending ? "Sending..." : "Send WhatsApp"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="font-heading font-bold text-charcoal mb-4">Recent Messages</h3>
          {messages.length === 0 ? (
            <p className="text-sm text-warmgray">No messages sent yet.</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((msg) => (
                <li key={msg.id} className="border-b border-cream last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-charcoal line-clamp-2">{msg.message_body}</p>
                    <span className={`text-xs font-medium shrink-0 ${statusColors[msg.status]}`}>{msg.status}</span>
                  </div>
                  <p className="text-xs text-warmgray mt-1">{msg.recipient_phone} · {msg.created_at.split("T")[0]}</p>
                  {msg.error_detail && (
                    <p className="text-xs text-red-400 mt-1 bg-red-50 rounded px-2 py-1 break-words">{msg.error_detail}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
