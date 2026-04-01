import ProgressRing from "@/components/ui/ProgressRing";
import { getDayNumber, getDaysRemaining, getProgressPercent } from "@/lib/goal-calculations";
import type { Goal } from "@/types";

interface GoalProgressCardProps {
  goal: Goal;
  revenueToDate: number;
}

export default function GoalProgressCard({ goal, revenueToDate }: GoalProgressCardProps) {
  const dayNum = getDayNumber(goal.start_date);
  const daysLeft = getDaysRemaining(goal.end_date);
  const percent = getProgressPercent(revenueToDate, goal.revenue_target);

  return (
    <div className="card">
      <div className="flex items-center gap-5">
        <ProgressRing percent={percent} size={100} strokeWidth={8} label={`${Math.round(percent)}%`} sublabel="done" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Day {dayNum} of 90 · {daysLeft}d left</p>
          <h2 className="font-heading font-bold text-charcoal text-base leading-snug line-clamp-2">{goal.title}</h2>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Revenue to date</p>
          <p className="font-heading font-bold text-[#FFAA00] text-xl mt-0.5">${revenueToDate.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Target</p>
          <p className="font-heading font-bold text-charcoal text-xl mt-0.5">${goal.revenue_target.toLocaleString()}</p>
        </div>
      </div>

      {/* Month milestones */}
      {(goal.month1_target || goal.month2_target || goal.month3_target) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {goal.month1_target && (
            <div className="flex-1 text-center bg-gray-50 rounded-lg py-1.5">
              <p className="text-[10px] text-gray-400">M1</p>
              <p className="text-xs font-semibold text-charcoal">${goal.month1_target.toLocaleString()}</p>
            </div>
          )}
          {goal.month2_target && (
            <div className="flex-1 text-center bg-gray-50 rounded-lg py-1.5">
              <p className="text-[10px] text-gray-400">M2</p>
              <p className="text-xs font-semibold text-charcoal">${goal.month2_target.toLocaleString()}</p>
            </div>
          )}
          {goal.month3_target && (
            <div className="flex-1 text-center bg-gray-50 rounded-lg py-1.5">
              <p className="text-[10px] text-gray-400">M3</p>
              <p className="text-xs font-semibold text-charcoal">${goal.month3_target.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
