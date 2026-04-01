import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientSidebar from "@/components/layout/ClientSidebar";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin/clients");

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <ClientSidebar clientName={profile?.full_name ?? user.email ?? "Client"} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-5 md:p-6 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
