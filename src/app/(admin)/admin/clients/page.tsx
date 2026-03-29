import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getRevenueTotal, getProgressPercent, getDayNumber } from "@/lib/goal-calculations";
import type { Profile, Goal, DailyLog } from "@/types";

export default async function AdminClientsPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false }) as { data: Profile[] | null };

  // Fetch active goals for all clients
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active") as { data: Goal[] | null };

  // Fetch recent logs sorted desc — pre-sorted so no per-client sort needed
  const { data: allLogs } = await supabase
    .from("daily_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(500) as { data: DailyLog[] | null };

  const goalMap = Object.fromEntries((goals ?? []).map((g) => [g.client_id, g]));
  // allLogs already sorted desc — first entry per client is the most recent
  const logsByClient = (allLogs ?? []).reduce<Record<string, DailyLog[]>>((acc, l) => {
    if (!acc[l.client_id]) acc[l.client_id] = [];
    acc[l.client_id].push(l);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-charcoal">Clients</h1>
        <span className="text-warmgray text-sm">{clients?.length ?? 0} total</span>
      </div>

      {(!clients || clients.length === 0) ? (
        <div className="card text-center py-12">
          <p className="text-warmgray">No clients yet. Share your registration link to get started.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-light text-left">
                {["Client", "Goal", "Day #", "Revenue", "Progress", "Last Log", ""].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-xs font-semibold text-warmgray uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const goal = goalMap[client.id];
                const logs = logsByClient[client.id] ?? [];
                const revenue = getRevenueTotal(logs);
                const percent = goal ? getProgressPercent(revenue, goal.revenue_target) : 0;
                const dayNum = goal ? getDayNumber(goal.start_date) : null;
                const lastLog = logs[0]; // already sorted desc by Supabase query

                return (
                  <tr key={client.id} className="border-b border-cream last:border-0 hover:bg-amber-wash/30 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-charcoal">{client.full_name ?? "—"}</p>
                      <p className="text-xs text-warmgray">{client.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-warmgray">{goal?.title ?? <span className="italic text-warmgray/60">No goal</span>}</td>
                    <td className="py-3 pr-4 text-charcoal">{dayNum ?? "—"}</td>
                    <td className="py-3 pr-4 font-semibold text-amber-brand">
                      {goal ? `$${revenue.toLocaleString()} / $${goal.revenue_target.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {goal ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-amber-light rounded-full h-2 w-24">
                            <div
                              className="bg-amber-brand h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-warmgray">{Math.round(percent)}%</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-warmgray">{lastLog?.log_date ?? "Never"}</td>
                    <td className="py-3">
                      <Link href={`/admin/clients/${client.id}`} className="text-amber-brand text-xs font-medium hover:underline whitespace-nowrap">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
