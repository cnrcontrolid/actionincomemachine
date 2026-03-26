import { type LucideIcon } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  color?: "amber" | "green" | "red" | "gray";
  sub?: string;
}

const colorMap = {
  amber: "text-amber-brand bg-amber-wash",
  green: "text-green-700 bg-green-50",
  red: "text-red-600 bg-red-50",
  gray: "text-warmgray bg-cream",
};

export default function StatCard({ label, value, icon: Icon, color = "amber", sub }: StatCardProps) {
  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={clsx("p-2.5 rounded-xl shrink-0", colorMap[color])}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-warmgray text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="font-heading font-bold text-2xl text-charcoal mt-0.5">{value}</p>
        {sub && <p className="text-warmgray text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
