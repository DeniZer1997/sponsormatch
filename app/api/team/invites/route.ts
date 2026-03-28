import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/team/invites — Pending Invites der eigenen Org
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

  const { data: invites } = await supabaseAdmin
    .from("team_invites")
    .select("id, email, role, created_at")
    .eq("organization_id", profile.organization_id)
    .eq("accepted", false)
    .order("created_at", { ascending: false });

  return NextResponse.json(invites ?? []);
}

// DELETE /api/team/invites?id=xxx — Einladung zurückziehen
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const inviteId = req.nextUrl.searchParams.get("id");
  if (!inviteId) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return NextResponse.json({ error: "Nur Admins" }, { status: 403 });

  await supabaseAdmin
    .from("team_invites")
    .delete()
    .eq("id", inviteId)
    .eq("organization_id", profile.organization_id);

  return NextResponse.json({ ok: true });
}
