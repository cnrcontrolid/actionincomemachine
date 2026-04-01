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

  if (!goalId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-heading font-bold text-lg text-charcoal">No active goal yet</p>
          <p className="text-sm text-gray-400 mt-1">Your coach will set up your actions after your onboarding session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl h-full flex flex-col">
      <DailyChecklistCard actions={actions} completions={completions} logDate={today} />
    </div>
  );
}
