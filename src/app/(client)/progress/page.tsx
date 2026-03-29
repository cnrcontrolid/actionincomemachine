import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CombinedProgressChart from "@/components/progress/CombinedProgressChart";
import StatCard from "@/components/ui/StatCard";
import { getRevenueTotal, getProgressPercent, getDayNumber } from "@/lib/goal-calculations";
import { TrendingUp, DollarSign, Minus, Activity } from "lucide-react";
import type { Goal, DailyLog, Profile } from "@/types";

export default async function ProgressPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All three queries only need user.id — run in parallel
  const [
    { data: goal },
    { data: logs },
    { data: profile },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("client_id", user.id).eq("status", "active").single() as Promise<{ data: Goal | null }>,
    supabase.from("daily_logs").select("*").eq("client_id", user.id).order("log_date").limit(90) as Promise<{ data: DailyLog[] | null }>,
    supabase.from("profiles").select("*").eq("id", user.id).single() as Promise<{ data: Profile | null }>,
  ]);

  const allLogs = logs ?? [];
  const revenueToDate = getRevenueTotal(allLogs);
  const totalExpenses = allLogs.reduce((s, l) => s + l.expenses, 0);
  const netIncome = revenueToDate - totalExpenses;
  const percent = goal ? getProgressPercent(revenueToDate, goal.revenue_target) : 0;
  const dayNum = goal ? getDayNumber(goal.start_date) : 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading font-bold text-3xl text-charcoal">Progress</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue to date" value={`$${revenueToDate.toLocaleString()}`} icon={DollarSign} color="amber" />
        <StatCard label="Net income" value={`$${netIncome.toLocaleString()}`} icon={TrendingUp} color={netIncome >= 0 ? "green" : "red"} />
        <StatCard label="Total expenses" value={`$${totalExpenses.toLocaleString()}`} icon={Minus} color="red" />
        <StatCard label="Goal progress" value={`${Math.round(percent)}%`} icon={Activity} color="amber" sub={`Day ${dayNum} of 90`} />
      </div>

      <CombinedProgressChart goal={goal} logs={allLogs} profile={profile} />
    </div>
  );
}
