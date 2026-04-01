"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Target,
  TrendingUp,
  BookOpen,
  CheckSquare,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/goals", label: "My Goals", icon: Target },
  { href: "/actions", label: "Actions", icon: CheckSquare },
  { href: "/income", label: "Income", icon: DollarSign },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function ClientSidebar({ clientName }: { clientName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-52 h-screen bg-white border-r border-gray-100 shrink-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <p className="font-heading font-bold text-amber-brand text-[15px] leading-snug">
          Action Income<br />Machine
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors",
                active
                  ? "bg-[#FFF8E8] text-[#FFAA00]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-100">
        <div className="px-3 py-1 mb-0.5">
          <p className="text-[11px] text-gray-400 font-medium truncate">{clientName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors w-full"
        >
          <LogOut size={15} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
