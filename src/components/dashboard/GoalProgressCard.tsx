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
    <div className="card flex flex-col sm:flex-row items-center gap-6">
      <ProgressRing
        percent={percent}
        size={140}
        label={`${Math.round(percent)}%`}
        sublabel="of target"
      />
      <div className="flex-1 space-y-3">
        <div>
          <h3 className="font-heading font-bold text-charcoal text-lg">{goal.title}</h3>
          <p className="text-warmgray text-sm">Day {dayNum} of 90 &bull; {daysLeft} days remaining</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-wash rounded-xl p-3">
            <p className="text-xs text-warmgray font-medium uppercase tracking-wide">Revenue to date</p>
            <p className="font-heading font-bold text-amber-brand text-xl mt-0.5">
              ${revenueToDate.toLocaleString()}
            </p>
          </div>
          <div className="bg-amber-wash rounded-xl p-3">
            <p className="text-xs text-warmgray font-medium uppercase tracking-wide">Target</p>
            <p className="font-heading font-bold text-charcoal text-xl mt-0.5">
              ${goal.revenue_target.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {goal.month1_target && (
            <div className="bg-cream rounded-lg p-2">
              <p className="text-xs text-warmgray">Month 1</p>
              <p className="text-sm font-semibold text-charcoal">${goal.month1_target.toLocaleString()}</p>
            </div>
          )}
          {goal.month2_target && (
            <div className="bg-cream rounded-lg p-2">
              <p className="text-xs text-warmgray">Month 2</p>
              <p className="text-sm font-semibold text-charcoal">${goal.month2_target.toLocaleString()}</p>
            </div>
          )}
          {goal.month3_target && (
            <div className="bg-cream rounded-lg p-2">
              <p className="text-xs text-warmgray">Month 3</p>
              <p className="text-sm font-semibold text-charcoal">${goal.month3_target.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
