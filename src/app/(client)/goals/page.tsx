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

  if (loading) return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-heading font-bold text-lg text-charcoal">No active goal yet</p>
          <p className="text-sm text-gray-400 mt-1">Your coach will set this up after your onboarding call.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left column — progress */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <GoalProgressCard goal={goal} revenueToDate={getRevenueTotal(logs)} />

        {goal.zoom_link && (
          <div className="card py-3 px-4 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Coaching session</p>
            <a
              href={goal.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#FFAA00] hover:underline"
            >
              Join →
            </a>
          </div>
        )}

        {goal.notes && (
          <div className="card py-3 px-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes from coach</p>
            <p className="text-sm text-charcoal leading-relaxed">{goal.notes}</p>
          </div>
        )}
      </div>

      {/* Right column — targets / products */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Segmented tab control */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit mb-3 shrink-0">
          {([
            { id: "targets", label: "Targets" },
            { id: "products", label: "Products" },
          ] as { id: GoalTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto card p-0">
          {activeTab === "targets" && (
            <div className="p-5">
              <TargetsList targets={targets} canMarkMet={true} />
              {targets.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No targets set yet. Your coach will add these.</p>
              )}
            </div>
          )}
          {activeTab === "products" && (
            <div className="p-5">
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No products set yet. Your coach will add these.</p>
              ) : (
                <div className="space-y-2">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{p.name}</p>
                        <p className="text-xs text-gray-400">{tierLabel[p.tier]}</p>
                      </div>
                      <p className="font-heading font-bold text-[#FFAA00]">${p.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
