import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import DailyChecklistCard from "@/components/dashboard/DailyChecklistCard";
import type { DailyAction, DailyActionCompletion } from "@/types";

export default async function ActionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");

  const [goalRes, completionsRes] = await Promise.all([
    supabase.from("goals").select("id").eq("client_id", user.id).eq("status", "active").single(),
    supabase.from("daily_action_completions").select("*").eq("client_id", user.id).eq("log_date", today),
  ]);

  const goalId = goalRes.data?.id ?? null;

  const actionsRes = await supabase
    .from("daily_actions")
    .select("*")
    .eq("client_id", user.id)
    .eq("goal_id", goalId ?? "none")
    .eq("is_active", true)
    .order("sort_order");

  const actions = (actionsRes.data as DailyAction[] | null) ?? [];
  const completions = (completionsRes.data as DailyActionCompletion[] | null) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-charcoal">Actions</h1>
        <p className="text-warmgray mt-1">Your daily action checklist</p>
      </div>

      {!goalId ? (
        <div className="card text-center py-12">
          <p className="font-heading text-xl text-charcoal font-bold">No active goal yet</p>
          <p className="text-warmgray mt-2 text-sm">Your coach will set up your 90-day goal and actions after your onboarding session.</p>
        </div>
      ) : (
        <DailyChecklistCard
          actions={actions}
          completions={completions}
          logDate={today}
        />
      )}
    </div>
  );
}
