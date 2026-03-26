"use client";

import { useState, useTransition } from "react";
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

  const today = new Date();

  // Filter helpers
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  function filterActions(t: Tab): DailyAction[] {
    if (t === "today") return actions; // all active actions show on "today"
    if (t === "week") {
      return actions.filter((a) => {
        if (!a.target_date) return false;
        try {
          return isWithinInterval(parseISO(a.target_date), { start: weekStart, end: weekEnd });
        } catch {
          return false;
        }
      });
    }
    if (t === "month") {
      return actions.filter((a) => {
        if (!a.target_date) return false;
        try {
          return isWithinInterval(parseISO(a.target_date), { start: monthStart, end: monthEnd });
        } catch {
          return false;
        }
      });
    }
    return actions;
  }

  function groupByGroupName(items: DailyAction[]): Record<string, DailyAction[]> {
    return items.reduce<Record<string, DailyAction[]>>((acc, a) => {
      const group = a.group_name ?? "General";
      if (!acc[group]) acc[group] = [];
      acc[group].push(a);
      return acc;
    }, {});
  }

  const filteredActions = filterActions(tab);
  const completed = actions.filter((a) => optimistic[a.id]).length;

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
            "flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border transition-all",
            done
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-white border-gray-200 text-gray-800 hover:border-[#FFAA00]"
          )}
        >
          {done ? (
            <CheckCircle2 size={18} className="text-[#30B33C] shrink-0" />
          ) : (
            <Circle size={18} className="text-gray-400 shrink-0" />
          )}
          <span className={clsx("text-sm flex-1", done && "line-through opacity-70")}>
            {action.label}
          </span>
          {action.link_url && (
            <a
              href={action.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-[#FFAA00] shrink-0"
            >
              <ExternalLink size={14} />
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
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          {groupName}
        </p>
        <ul className="space-y-2 mb-4">
          {groupActions.map(renderActionRow)}
        </ul>
      </div>
    ));
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-charcoal uppercase tracking-wide">ACTIONS</h3>
        <span className="text-sm text-gray-500">{completed}/{actions.length} done</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all",
              tab === key
                ? "bg-white text-[#FFAA00] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredActions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">
          {tab === "today"
            ? "No daily actions set yet. Your coach will add them after your goal session."
            : `No actions scheduled for this ${tab === "week" ? "week" : "month"}.`}
        </p>
      ) : tab === "today" ? (
        <ul className="space-y-2">
          {filteredActions.map(renderActionRow)}
        </ul>
      ) : (
        renderGrouped(filteredActions)
      )}
    </div>
  );
}
