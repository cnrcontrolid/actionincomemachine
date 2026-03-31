"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import TargetsList from "@/components/goals/TargetsList";
import type { Goal, Target, Product } from "@/types";

const tierLabel: Record<string, string> = {
  low: "Low ticket ($7–$27)",
  mid: "Mid ticket ($997–$2997)",
  high: "High ticket ($6997–$9997)",
};

type GoalTab = "targets" | "products";

export default function GoalsPage() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GoalTab>("targets");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [goalRes, targetsRes, productsRes] = await Promise.all([
        supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single(),
        supabase.from("targets").select("*").eq("client_id", user.id).order("sort_order"),
        supabase.from("products").select("*").eq("client_id", user.id).eq("is_active", true).order("tier"),
      ]);
      setGoal(goalRes.data as Goal | null);
      setTargets((targetsRes.data as Target[] | null) ?? []);
      setProducts((productsRes.data as Product[] | null) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-warmgray p-8">Loading...</div>;

  if (!goal) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl text-charcoal mb-6">My Goals</h1>
        <div className="card text-center py-12">
          <p className="font-heading text-xl text-charcoal font-bold">No active goal yet</p>
          <p className="text-warmgray mt-2 text-sm">Your coach will set this up after your onboarding call.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">My Goals</h1>

      {/* Goal Header Card — always visible */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading font-bold text-xl text-charcoal">{goal.title}</h2>
            <p className="text-warmgray text-sm mt-1">{goal.start_date} → {goal.end_date}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-warmgray uppercase tracking-wide font-medium">Revenue Target</p>
            <p className="font-heading font-bold text-amber-brand text-2xl">${goal.revenue_target.toLocaleString()}</p>
          </div>
        </div>

        {goal.notes && (
          <div className="bg-amber-wash rounded-xl p-4">
            <p className="text-sm text-charcoal">{goal.notes}</p>
          </div>
        )}

        {goal.zoom_link && (
          <a
            href={goal.zoom_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-amber-brand font-medium hover:underline"
          >
            Join Zoom session →
          </a>
        )}
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          {([
            { id: "targets", label: "Your Targets" },
            { id: "products", label: "Your Products" },
          ] as { id: GoalTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-[#FFAA00] text-[#FFAA00]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "targets" && (
        <div className="card">
          <TargetsList targets={targets} canMarkMet={true} />
          {targets.length === 0 && (
            <p className="text-sm text-warmgray text-center py-6">No targets set yet. Your coach will add these.</p>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="card">
          {products.length === 0 ? (
            <p className="text-sm text-warmgray text-center py-6">No products set yet. Your coach will add these.</p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-amber-light last:border-0">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{p.name}</p>
                    <p className="text-xs text-warmgray">{tierLabel[p.tier]}</p>
                  </div>
                  <p className="font-heading font-bold text-amber-brand">${p.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
