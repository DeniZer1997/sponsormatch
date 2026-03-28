import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/team/members — Alle Mitglieder der eigenen Org
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) return NextResponse.json([]);

  const { data: members } = await supabaseAdmin
    .from("profiles")
    .select("id, name, display_name, role")
    .eq("organization_id", profile.organization_id)
    .order("role", { ascending: true });

  return NextResponse.json(members ?? []);
}

// DELETE /api/team/members?id=xxx — Mitglied aus Org entfernen (nur Admin)
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
  if (memberId === user.id) return NextResponse.json({ error: "Sich selbst kann man nicht entfernen" }, { status: 400 });

  const { data: adminProfile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") return NextResponse.json({ error: "Nur Admins können Mitglieder entfernen" }, { status: 403 });

  // Mitglied aus Org entfernen (organization_id auf null setzen)
  await supabaseAdmin
    .from("profiles")
    .update({ organization_id: null })
    .eq("id", memberId)
    .eq("organization_id", adminProfile.organization_id);

  return NextResponse.json({ ok: true });
}
