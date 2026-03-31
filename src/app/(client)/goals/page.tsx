"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import TargetsList from "@/components/goals/TargetsList";
import GoalProgressCard from "@/components/dashboard/GoalProgressCard";
import { getRevenueTotal } from "@/lib/goal-calculations";
import type { Goal, Target, Product, DailyLog } from "@/types";

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
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GoalTab>("targets");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [goalRes, targetsRes, productsRes, logsRes] = await Promise.all([
        supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single(),
        supabase.from("targets").select("*").eq("client_id", user.id).order("sort_order"),
        supabase.from("products").select("*").eq("client_id", user.id).eq("is_active", true).order("tier"),
        supabase.from("daily_logs").select("*").eq("client_id", user.id).limit(90),
      ]);
      setGoal(goalRes.data as Goal | null);
      setTargets((targetsRes.data as Target[] | null) ?? []);
      setProducts((productsRes.data as Product[] | null) ?? []);
      setLogs((logsRes.data as DailyLog[] | null) ?? []);
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

      <GoalProgressCard goal={goal} revenueToDate={getRevenueTotal(logs)} />

      {goal.zoom_link && (
        <div className="card py-3 px-5 flex items-center justify-between">
          <p className="text-sm font-medium text-charcoal">Next coaching session</p>
          <a href={goal.zoom_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFAA00] hover:underline">
            Join Zoom →
          </a>
        </div>
      )}

      {goal.notes && (
        <div className="bg-amber-wash rounded-xl px-5 py-4">
          <p className="text-sm text-charcoal">{goal.notes}</p>
        </div>
      )}

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
