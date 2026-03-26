"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Mail,
  Lightbulb,
  BookOpen,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/messages", label: "WhatsApp", icon: MessageSquare },
  { href: "/admin/emails", label: "Email Sequences", icon: Mail },
  { href: "/admin/content/trend-steps", label: "Trend Steps", icon: Lightbulb },
  { href: "/admin/content/knowledge-base", label: "Knowledge Base", icon: BookOpen },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-charcoal">
      <div className="px-6 py-5 border-b border-white/10">
        <p className="font-heading font-bold text-amber-brand text-lg leading-tight">Action Income</p>
        <p className="font-heading font-bold text-amber-brand text-lg leading-tight">Machine</p>
        <span className="text-xs text-white/40 font-medium mt-1 inline-block">Admin Panel</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"))
                ? "bg-amber-brand text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-white/40 font-medium truncate">{adminName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
