import { differenceInDays, parseISO, subDays, format } from "date-fns";
import type { DailyLog, Target, TrendCondition } from "@/types";

export function getDayNumber(startDate: string, today = new Date()): number {
  return Math.max(1, differenceInDays(today, parseISO(startDate)) + 1);
}

export function getDaysRemaining(endDate: string, today = new Date()): number {
  return Math.max(0, differenceInDays(parseISO(endDate), today));
}

export function getRevenueTotal(logs: DailyLog[]): number {
  return logs.reduce((sum, l) => sum + l.income_low + l.income_mid + l.income_high, 0);
}

export function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, (current / target) * 100);
}

/** Revenue we *should* have at today's date at linear pace */
export function getPaceTarget(revenueTarget: number, startDate: string, today = new Date()): number {
  const dayNum = getDayNumber(startDate, today);
  return (revenueTarget / 90) * dayNum;
}

/** Net income today across all product tiers */
export function getTodayNet(log: DailyLog | null): number {
  if (!log) return 0;
  return log.income_low + log.income_mid + log.income_high - log.expenses;
}

/** Determine the current trend condition for this client */
export function getTrendCondition(
  revenueTarget: number,
  startDate: string,
  logs: DailyLog[],
  targets: Target[],
  today = new Date()
): TrendCondition {
  // Check: no logs in last 3 days
  const yesterday = format(subDays(today, 1), "yyyy-MM-dd");
  const twoDaysAgo = format(subDays(today, 2), "yyyy-MM-dd");
  const threeDaysAgo = format(subDays(today, 3), "yyyy-MM-dd");
  const recentDates = [yesterday, twoDaysAgo, threeDaysAgo];
  const recentLogs = logs.filter((l) => recentDates.includes(l.log_date));
  if (recentLogs.length === 0 && getDayNumber(startDate, today) > 3) {
    return "no_logs_3_days";
  }

  // Check: overdue unmet critical target
  const todayStr = format(today, "yyyy-MM-dd");
  const missedCritical = targets.some(
    (t) => t.type === "critical" && !t.is_met && t.due_date && t.due_date < todayStr
  );
  if (missedCritical) return "critical_target_missed";

  // Compare revenue pace
  const revenue = getRevenueTotal(logs);
  const pace = getPaceTarget(revenueTarget, startDate, today);
  const ratio = pace > 0 ? revenue / pace : 1;

  if (ratio < 0.9) return "behind_pace";
  if (ratio > 1.1) return "ahead_of_pace";
  return "on_pace";
}

/** Build cumulative revenue series for charts */
export function buildCumulativeSeries(
  logs: DailyLog[],
  startDate: string,
  revenueTarget: number
): { date: string; actual: number; pace: number }[] {
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  let cumulative = 0;
  return sorted.map((log) => {
    cumulative += log.income_low + log.income_mid + log.income_high;
    const dayNum = getDayNumber(startDate, parseISO(log.log_date));
    return {
      date: log.log_date,
      actual: cumulative,
      pace: Math.round((revenueTarget / 90) * dayNum),
    };
  });
}
