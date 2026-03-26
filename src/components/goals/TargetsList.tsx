"use client";

import { useState } from "react";
import { CheckCircle2, Circle, AlertCircle, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { Target } from "@/types";

interface TargetsListProps {
  targets: Target[];
  canMarkMet?: boolean;
}

export default function TargetsList({ targets, canMarkMet = true }: TargetsListProps) {
  const critical = targets.filter((t) => t.type === "critical");
  const major = targets.filter((t) => t.type === "major");
  const [updating, setUpdating] = useState<string | null>(null);
  const [localMet, setLocalMet] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(targets.map((t) => [t.id, t.is_met]))
  );

  async function toggleMet(target: Target) {
    if (!canMarkMet || updating) return;
    const next = !localMet[target.id];
    setUpdating(target.id);
    setLocalMet((prev) => ({ ...prev, [target.id]: next }));
    await fetch(`/api/targets/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_met: next }),
    });
    setUpdating(null);
  }

  function renderGroup(items: Target[], title: string, badgeClass: string) {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className={badgeClass}>{title}</span>
          <span className="text-xs text-warmgray">{items.filter((t) => localMet[t.id]).length}/{items.length} met</span>
        </div>
        <ul className="space-y-2">
          {items.map((target) => {
            const met = localMet[target.id];
            return (
              <li
                key={target.id}
                className={clsx(
                  "flex items-start gap-3 p-3.5 rounded-xl border transition-colors",
                  met
                    ? "bg-green-50 border-green-200"
                    : target.type === "critical"
                    ? "bg-red-50/50 border-red-200"
                    : "bg-white border-amber-light"
                )}
              >
                <button
                  onClick={() => toggleMet(target)}
                  disabled={!canMarkMet || updating === target.id}
                  className="mt-0.5 shrink-0"
                >
                  {met ? (
                    <CheckCircle2 size={18} className="text-green-600" />
                  ) : target.type === "critical" ? (
                    <AlertCircle size={18} className="text-red-500" />
                  ) : (
                    <Circle size={18} className="text-warmgray" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-medium text-charcoal", met && "line-through opacity-60")}>
                    {target.title}
                  </p>
                  {target.description && (
                    <p className="text-xs text-warmgray mt-0.5">{target.description}</p>
                  )}
                  {target.due_date && (
                    <p className="text-xs text-warmgray mt-1">Due: {target.due_date}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup(critical, "Critical Targets", "badge-critical")}
      {renderGroup(major, "Major Targets", "badge-major")}
      {targets.length === 0 && (
        <p className="text-warmgray text-sm text-center py-8">No targets set yet.</p>
      )}
    </div>
  );
}
