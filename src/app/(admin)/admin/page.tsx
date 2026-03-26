import { createAdminClient } from "@/lib/supabase/server";
import { getDayNumber } from "@/lib/goal-calculations";
import Link from "next/link";
import { format } from "date-fns";
import type { Profile, Goal, DailyLog } from "@/types";

interface ClientRow {
  profile: Profile;
  goal: Goal | null;
  todayLog: DailyLog | null;
  actionsToday: number;
  lastLogDate: string | null;
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch all client profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("full_name") as { data: Profile[] | null };

  const clients: ClientRow[] = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      // Active goal
      const { data: goal } = await supabase
        .from("goals")
        .select("*")
        .eq("client_id", profile.id)
        .eq("status", "active")
        .single() as { data: Goal | null };

      if (!goal) {
        return { profile, goal: null, todayLog: null, actionsToday: 0, lastLogDate: null };
      }

      // Today's daily log
      const { data: todayLog } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("client_id", profile.id)
        .eq("log_date", today)
        .single() as { data: DailyLog | null };

      // Today's action completions count
      const { count: actionsToday } = await supabase
        .from("daily_action_completions")
        .select("*", { count: "exact", head: true })
        .eq("client_id", profile.id)
        .eq("log_date", today)
        .eq("completed", true);

      // Last log date
      const { data: lastLogRow } = await supabase
        .from("daily_logs")
        .select("log_date")
        .eq("client_id", profile.id)
        .order("log_date", { ascending: false })
        .limit(1)
        .single() as { data: { log_date: string } | null };

      return {
        profile,
        goal,
        todayLog: todayLog ?? null,
        actionsToday: actionsToday ?? 0,
        lastLogDate: lastLogRow?.log_date ?? null,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-warmgray font-medium">Admin Panel</p>
        <h1 className="font-heading font-bold text-3xl text-charcoal">Dashboard</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Day #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue Target</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions Today</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Income Today</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Log</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-warmgray">No clients yet.</td>
                </tr>
              )}
              {clients.map(({ profile, goal, todayLog, actionsToday, lastLogDate }) => {
                const dayNum = goal ? getDayNumber(goal.start_date) : null;
                const incomeToday = todayLog
                  ? (todayLog.income_total > 0
                      ? todayLog.income_total
                      : todayLog.income_low + todayLog.income_mid + todayLog.income_high)
                  : 0;

                return (
                  <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-charcoal">{profile.full_name ?? "—"}</p>
                      <p className="text-xs text-warmgray">{profile.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {goal && dayNum != null ? (
                        <span className="font-medium text-charcoal">
                          <span className="text-[#FFAA00] font-bold">{dayNum}</span>
                          <span className="text-warmgray"> / 90</span>
                        </span>
                      ) : (
                        <span className="text-warmgray text-xs">No goal</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {goal ? (
                        <span className="font-medium text-charcoal">${goal.revenue_target.toLocaleString()}</span>
                      ) : (
                        <span className="text-warmgray text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {goal ? (
                        <span className={actionsToday > 0 ? "text-[#FFAA00] font-semibold" : "text-warmgray"}>
                          {actionsToday} completed
                        </span>
                      ) : (
                        <span className="text-warmgray text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {goal ? (
                        <span className={incomeToday > 0 ? "text-green-600 font-semibold" : "text-warmgray"}>
                          ${incomeToday.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-warmgray text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-warmgray">
                      {lastLogDate ? lastLogDate : <span className="text-xs italic">No logs yet</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/clients/${profile.id}`}
                        className="inline-block bg-[#FFAA00] text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#e69900] transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
