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
    <div className="flex min-h-screen bg-cream">
      <ClientSidebar clientName={profile?.full_name ?? user.email ?? "Client"} />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
