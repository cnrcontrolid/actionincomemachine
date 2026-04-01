"use client";

import { useState, useTransition, useMemo } from "react";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import clsx from "clsx";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
} from "date-fns";
import type { DailyAction, DailyActionCompletion } from "@/types";

type Tab = "today" | "week" | "month";

interface DailyChecklistCardProps {
  actions: DailyAction[];
  completions: DailyActionCompletion[];
  logDate: string;
}

export default function DailyChecklistCard({ actions, completions, logDate }: DailyChecklistCardProps) {
  const [tab, setTab] = useState<Tab>("today");
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(completions.map((c) => [c.action_id, c.completed]))
  );
  const [, startTransition] = useTransition();

  async function toggle(actionId: string) {
    const next = !optimistic[actionId];
    setOptimistic((prev) => ({ ...prev, [actionId]: next }));
    startTransition(async () => {
      await fetch("/api/action-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: actionId, log_date: logDate, completed: next }),
      });
    });
  }

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);

  const filteredActions = useMemo(() => {
    if (tab === "today") return actions;
    if (tab === "week") {
      return actions.filter((a) => {
        if (!a.target_date) return false;
        try { return isWithinInterval(parseISO(a.target_date), { start: weekStart, end: weekEnd }); }
        catch { return false; }
      });
    }
    if (tab === "month") {
      return actions.filter((a) => {
        if (!a.target_date) return false;
        try { return isWithinInterval(parseISO(a.target_date), { start: monthStart, end: monthEnd }); }
        catch { return false; }
      });
    }
    return actions;
  }, [tab, actions, weekStart, weekEnd, monthStart, monthEnd]);

  function groupByGroupName(items: DailyAction[]): Record<string, DailyAction[]> {
    return items.reduce<Record<string, DailyAction[]>>((acc, a) => {
      const group = a.group_name ?? "General";
      if (!acc[group]) acc[group] = [];
      acc[group].push(a);
      return acc;
    }, {});
  }

  const completedCount = actions.filter((a) => optimistic[a.id]).length;
  const totalCount = actions.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  function renderActionRow(action: DailyAction) {
    const done = !!optimistic[action.id];
    return (
      <li key={action.id}>
        <button
          onClick={() => toggle(action.id)}
          className={clsx(
            "flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors",
            done
              ? "text-gray-400"
              : "text-charcoal hover:bg-gray-50"
          )}
        >
          {done ? (
            <CheckCircle2 size={16} className="text-[#30B33C] shrink-0" />
          ) : (
            <Circle size={16} className="text-gray-300 shrink-0" />
          )}
          <span className={clsx("text-sm flex-1 text-left", done && "line-through")}>
            {action.label}
          </span>
          {action.link_url && (
            <a
              href={action.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-300 hover:text-[#FFAA00] shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </button>
      </li>
    );
  }

  function renderGrouped(items: DailyAction[]) {
    const groups = groupByGroupName(items);
    return Object.entries(groups).map(([groupName, groupActions]) => (
      <div key={groupName}>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-3">
          {groupName}
        </p>
        <ul className="mb-4">
          {groupActions.map(renderActionRow)}
        </ul>
      </div>
    ));
  }

  return (
    <div className="card flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-charcoal">Actions</span>
          <span className="text-xs text-gray-400">{completedCount}/{totalCount}</span>
        </div>
        {/* Mini progress bar */}
        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#30B33C] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Segmented tabs */}
      <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 mb-3 shrink-0 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "px-3 py-1 text-[12px] font-semibold rounded-md transition-all",
              tab === key
                ? "bg-white text-charcoal shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Action list — scrollable */}
      <div className="flex-1 overflow-y-auto -mx-1">
        {filteredActions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {tab === "today"
              ? "No actions set yet. Your coach will add them after your goal session."
              : `No actions scheduled for this ${tab === "week" ? "week" : "month"}.`}
          </p>
        ) : tab === "today" ? (
          <ul>
            {filteredActions.map(renderActionRow)}
          </ul>
        ) : (
          renderGrouped(filteredActions)
        )}
      </div>
    </div>
  );
}
