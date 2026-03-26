"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product, Goal } from "@/types";

const tiers = [
  { value: "low", label: "Low ticket", range: "$7 – $27" },
  { value: "mid", label: "Mid ticket", range: "$997 – $2,997" },
  { value: "high", label: "High ticket", range: "$6,997 – $9,997" },
];

export default function AdminProductsPage({ params }: { params: { clientId: string } }) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Record<string, { name: string; price: string }>>({
    low: { name: "", price: "" },
    mid: { name: "", price: "" },
    high: { name: "", price: "" },
  });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("goals").select("*").eq("client_id", params.clientId).eq("status", "active").single(),
      supabase.from("products").select("*").eq("client_id", params.clientId).eq("is_active", true),
    ]).then(([{ data: g }, { data: p }]) => {
      setGoal(g);
      setProducts(p ?? []);
      const prefill: Record<string, { name: string; price: string }> = { low: { name: "", price: "" }, mid: { name: "", price: "" }, high: { name: "", price: "" } };
      (p ?? []).forEach((prod: Product) => {
        prefill[prod.tier] = { name: prod.name, price: prod.price.toString() };
      });
      setForm(prefill);
    });
  }, [params.clientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    setSaving(true);
    const supabase = createClient();

    // Deactivate existing products for this goal
    await supabase.from("products").update({ is_active: false }).eq("goal_id", goal.id);

    const rows = tiers
      .filter((t) => form[t.value].name.trim() && form[t.value].price)
      .map((t) => ({
        client_id: params.clientId,
        goal_id: goal.id,
        tier: t.value,
        name: form[t.value].name.trim(),
        price: parseFloat(form[t.value].price),
        is_active: true,
      }));

    if (rows.length > 0) {
      await supabase.from("products").insert(rows);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">Products</h1>

      {!goal ? (
        <div className="card text-center py-10">
          <p className="text-warmgray">Set a 90-day goal first.</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {tiers.map((tier) => (
            <div key={tier.value} className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-charcoal">{tier.label}</h3>
                <span className="text-xs text-warmgray">{tier.range}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Product name</label>
                  <input className="input" placeholder="e.g. Starter Guide" value={form[tier.value].name}
                    onChange={(e) => setForm((p) => ({ ...p, [tier.value]: { ...p[tier.value], name: e.target.value } }))} />
                </div>
                <div>
                  <label className="label text-xs">Price ($)</label>
                  <input type="number" className="input" min="0" step="0.01" placeholder="27" value={form[tier.value].price}
                    onChange={(e) => setForm((p) => ({ ...p, [tier.value]: { ...p[tier.value], price: e.target.value } }))} />
                </div>
              </div>
            </div>
          ))}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save products"}
          </button>
        </form>
      )}
    </div>
  );
}
