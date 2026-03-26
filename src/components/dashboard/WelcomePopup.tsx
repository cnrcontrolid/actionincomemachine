"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getDayNumber, getDaysRemaining, getProgressPercent, getRevenueTotal } from "@/lib/goal-calculations";
import type { Goal } from "@/types";

interface WelcomePopupProps {
  goal: Goal | null;
  lastLogDate: string | null;
  onClose: () => void;
}

export default function WelcomePopup({ goal, lastLogDate, onClose }: WelcomePopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `aim_popup_dismissed_${today}`;
    if (!localStorage.getItem(key)) {
      setVisible(true);
    }
  }, []);

  function handleClose() {
    const today = new Date().toISOString().slice(0, 10);
    const key = `aim_popup_dismissed_${today}`;
    localStorage.setItem(key, "1");
    setVisible(false);
    onClose();
  }

  if (!visible) return null;

  const dayNumber = goal ? getDayNumber(goal.start_date) : null;
  const daysRemaining = goal ? getDaysRemaining(goal.end_date) : null;
  // We don't have logs here, so use 0 as revenue — parent can pass it if needed
  const percent = goal ? Math.round(getProgressPercent(0, goal.revenue_target)) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center">
      <div className="max-w-sm w-full mx-4 mt-32 bg-white rounded-2xl p-6 shadow-xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-4">
          <h2 className="font-bold text-xl text-gray-900">Action Income Machine</h2>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back!</p>
        </div>

        {goal ? (
          <div className="space-y-3 mb-5">
            <div className="bg-[#FFAA00]/10 rounded-xl px-4 py-3">
              <p className="font-semibold text-gray-800 text-sm">
                Day {dayNumber} of 90 — {daysRemaining} days left to hit your goal!
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-600">
                Revenue progress:{" "}
                <span className="font-semibold text-gray-800">
                  {percent}% of ${goal.revenue_target.toLocaleString()} target achieved
                </span>
              </p>
            </div>

            <div className="text-sm text-gray-500">
              {lastLogDate ? (
                <span>Last log submitted: <span className="font-medium text-gray-700">{lastLogDate}</span></span>
              ) : (
                <span className="text-[#FFAA00] font-medium">No logs yet — log today!</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <p className="text-sm text-gray-500">No active goal set yet. Your coach will set one up after onboarding.</p>
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full bg-[#FFAA00] hover:bg-[#e09900] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Log Today&apos;s Progress
        </button>
      </div>
    </div>
  );
}
