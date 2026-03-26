import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import type { KnowledgeResource, KnowledgeCategory } from "@/types";
import KnowledgeRequestForms from "./KnowledgeRequestForms";

const categoryLabel: Record<KnowledgeCategory, string> = {
  mindset: "Mindset",
  marketing: "Marketing",
  sales: "Sales",
  tech: "Tech",
  strategy: "Strategy",
};

const categoryColors: Record<KnowledgeCategory, string> = {
  mindset: "bg-purple-100 text-purple-700",
  marketing: "bg-blue-100 text-blue-700",
  sales: "bg-amber-wash text-amber-brand",
  tech: "bg-gray-100 text-gray-700",
  strategy: "bg-green-100 text-green-700",
};

export default async function ResourcesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resources } = await supabase
    .from("knowledge_resources")
    .select("*")
    .eq("is_published", true)
    .order("sort_order") as { data: KnowledgeResource[] | null };

  const byCategory = (resources ?? []).reduce<Record<string, KnowledgeResource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading font-bold text-3xl text-charcoal">Resources</h1>
        <p className="text-warmgray mt-1">Curated resources from your coach to accelerate your growth.</p>
      </div>

      {Object.keys(byCategory).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-warmgray">Resources coming soon! Your coach will add them here.</p>
        </div>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h2 className="font-heading font-bold text-charcoal text-lg mb-3">
              {categoryLabel[category as KnowledgeCategory]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card hover:border-amber-brand transition-colors group flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-charcoal group-hover:text-amber-brand transition-colors">
                      {resource.title}
                    </p>
                    <ExternalLink size={16} className="text-warmgray shrink-0 mt-0.5" />
                  </div>
                  {resource.description && (
                    <p className="text-sm text-warmgray">{resource.description}</p>
                  )}
                  <span className={`self-start text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryColors[resource.category]}`}>
                    {categoryLabel[resource.category]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))
      )}

      <KnowledgeRequestForms />
    </div>
  );
}
