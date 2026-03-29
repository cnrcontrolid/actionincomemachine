"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals", label: "My Goals", icon: Target },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/log-history", label: "Log History", icon: ClipboardList },
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
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-amber-light">
      <div className="px-6 py-5 border-b border-amber-light">
        <p className="font-heading font-bold text-amber-brand text-lg leading-tight">Action Income</p>
        <p className="font-heading font-bold text-amber-brand text-lg leading-tight">Machine</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-amber-wash text-amber-brand"
                : "text-warmgray hover:bg-cream hover:text-charcoal"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-amber-light">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-warmgray font-medium truncate">{clientName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-warmgray hover:bg-cream hover:text-charcoal transition-colors w-full"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
