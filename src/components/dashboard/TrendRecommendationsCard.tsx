import { Lightbulb, AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import clsx from "clsx";
import type { TrendCondition, TrendStep } from "@/types";

const conditionConfig: Record<TrendCondition, {
  label: string;
  icon: React.ElementType;
  bg: string;
  border: string;
  iconColor: string;
}> = {
  behind_pace: {
    label: "Behind pace",
    icon: TrendingDown,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-600",
  },
  on_pace: {
    label: "On pace",
    icon: Minus,
    bg: "bg-amber-wash",
    border: "border-amber-light",
    iconColor: "text-amber-brand",
  },
  ahead_of_pace: {
    label: "Ahead of pace",
    icon: TrendingUp,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-600",
  },
  no_logs_3_days: {
    label: "Missing check-ins",
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-600",
  },
  critical_target_missed: {
    label: "Critical target overdue",
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-600",
  },
};

interface TrendRecommendationsCardProps {
  condition: TrendCondition;
  steps: TrendStep[];
}

export default function TrendRecommendationsCard({ condition, steps }: TrendRecommendationsCardProps) {
  const config = conditionConfig[condition];
  const Icon = config.icon;

  if (steps.length === 0) return null;

  return (
    <div className={clsx("rounded-2xl border p-5", config.bg, config.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className={config.iconColor} />
        <span className={clsx("text-sm font-semibold", config.iconColor)}>{config.label} — Your action steps</span>
      </div>
      <ul className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={step.id} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/70 border border-current/20 flex items-center justify-center text-xs font-bold text-inherit">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-charcoal">{step.title}</p>
              <p className="text-xs text-warmgray mt-0.5">{step.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
