import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { supabase, user, isAdmin: profile?.role === "admin" };
}

export async function GET() {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("action_templates")
    .select(
      `
      *,
      action_template_items (*)
    `
    )
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, items } = body;

  if (!name) {
    return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
  }

  // Create the template
  const { data: template, error: templateError } = await supabase
    .from("action_templates")
    .insert({ name, description: description ?? null })
    .select()
    .single();

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 500 });
  }

  // Insert items if provided
  if (items && Array.isArray(items) && items.length > 0) {
    const itemRows = items.map(
      (item: {
        group_name?: string;
        label: string;
        notes?: string;
        link_url?: string;
        sort_order?: number;
      }) => ({
        template_id: template.id,
        group_name: item.group_name ?? null,
        label: item.label,
        notes: item.notes ?? null,
        link_url: item.link_url ?? null,
        sort_order: item.sort_order ?? 0,
      })
    );

    const { error: itemsError } = await supabase
      .from("action_template_items")
      .insert(itemRows);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  // Return the full template with items
  const { data: fullTemplate, error: fetchError } = await supabase
    .from("action_templates")
    .select(
      `
      *,
      action_template_items (*)
    `
    )
    .eq("id", template.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: fullTemplate }, { status: 201 });
}
