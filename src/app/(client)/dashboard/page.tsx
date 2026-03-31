import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import GoalProgressCard from "@/components/dashboard/GoalProgressCard";
import TrendRecommendationsCard from "@/components/dashboard/TrendRecommendationsCard";
import WelcomePopupWrapper from "@/components/dashboard/WelcomePopupWrapper";
import { getRevenueTotal, getTrendCondition } from "@/lib/goal-calculations";
import type { Goal, DailyLog, TrendStep, Target } from "@/types";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().slice(0, 10);

  // Batch 1: all queries that only need user.id — run in parallel
  const [goalRes, targetsRes] = await Promise.all([
    supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single(),
    supabase.from("targets").select("*").eq("client_id", user.id),
  ]);
  const goal = goalRes.data as Goal | null;
  const targets = targetsRes.data as Target[] | null;

  // Batch 2: queries that need goal.id — run in parallel
  const logsRes = await supabase
    .from("daily_logs")
    .select("*")
    .eq("client_id", user.id)
    .eq("goal_id", goal?.id ?? "none")
    .gte("log_date", cutoff)
    .order("log_date", { ascending: false })
    .limit(90);
  const allLogs = logsRes.data as DailyLog[] | null;
  const lastLogDate = allLogs?.[0]?.log_date ?? null;

  // Batch 3: trend steps (needs condition computed from logs + targets)
  const revenueToDate = getRevenueTotal(allLogs ?? []);
  const condition = goal
    ? getTrendCondition(goal.revenue_target, goal.start_date, allLogs ?? [], targets ?? [])
    : "on_pace";

  const { data: trendSteps } = await supabase
    .from("trend_steps")
    .select("*")
    .eq("condition", condition)
    .eq("is_active", true)
    .order("sort_order") as { data: TrendStep[] | null };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <WelcomePopupWrapper goal={goal} lastLogDate={lastLogDate} />
      <div>
        <h1 className="font-heading font-bold text-3xl text-charcoal">Dashboard</h1>
        <p className="text-warmgray mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {!goal ? (
        <div className="card text-center py-12">
          <p className="font-heading text-xl text-charcoal font-bold">No active goal yet</p>
          <p className="text-warmgray mt-2 text-sm">
            Your coach will set up your 90-day goal after your onboarding session.
          </p>
        </div>
      ) : (
        <>
          <GoalProgressCard goal={goal} revenueToDate={revenueToDate} />

          {trendSteps && trendSteps.length > 0 && (
            <TrendRecommendationsCard condition={condition} steps={trendSteps} />
          )}
        </>
      )}
    </div>
  );
}
