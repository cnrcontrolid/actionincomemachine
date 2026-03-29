import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TargetsList from "@/components/goals/TargetsList";
import type { Goal, Target, Product } from "@/types";

export default async function GoalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All three queries only need user.id — run in parallel
  const [
    { data: goal },
    { data: targets },
    { data: products },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single() as Promise<{ data: Goal | null }>,
    supabase.from("targets").select("*").eq("client_id", user.id).order("sort_order") as Promise<{ data: Target[] | null }>,
    supabase.from("products").select("*").eq("client_id", user.id).eq("is_active", true).order("tier") as Promise<{ data: Product[] | null }>,
  ]);

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

  const tierLabel: Record<string, string> = { low: "Low ticket ($7–$27)", mid: "Mid ticket ($997–$2997)", high: "High ticket ($6997–$9997)" };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">My Goals</h1>

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

      {products && products.length > 0 && (
        <div className="card">
          <h3 className="font-heading font-bold text-charcoal mb-4">Your Products</h3>
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
        </div>
      )}

      <div className="card">
        <h3 className="font-heading font-bold text-charcoal mb-4">Targets</h3>
        <TargetsList targets={targets ?? []} canMarkMet={true} />
      </div>
    </div>
  );
}
