"use client";

import dynamic from "next/dynamic";
import type { Goal } from "@/types";

const WelcomePopup = dynamic(() => import("./WelcomePopup"), { ssr: false });

interface WelcomePopupWrapperProps {
  goal: Goal | null;
  lastLogDate: string | null;
}

export default function WelcomePopupWrapper({ goal, lastLogDate }: WelcomePopupWrapperProps) {
  return <WelcomePopup goal={goal} lastLogDate={lastLogDate} onClose={() => {}} />;
}
