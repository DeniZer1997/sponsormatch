import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/team/invite/accept — Eingeloggter User nimmt Invite an
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token fehlt" }, { status: 400 });

  // Invite laden
  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from("team_invites")
    .select("id, email, role, accepted, organization_id")
    .eq("token", token)
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: "Einladung nicht gefunden oder abgelaufen" }, { status: 404 });
  }

  if (invite.accepted) {
    return NextResponse.json({ error: "Diese Einladung wurde bereits angenommen" }, { status: 410 });
  }

  // E-Mail-Check: Invite muss zur eingeloggten E-Mail passen
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({
      error: "Diese Einladung ist für eine andere E-Mail-Adresse"
    }, { status: 403 });
  }

  // Prüfen ob User bereits einer anderen Organisation angehört
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profile?.organization_id && profile.organization_id !== invite.organization_id) {
    return NextResponse.json({
      error: "Du gehörst bereits einer anderen Organisation an"
    }, { status: 409 });
  }

  // Profil updaten: Organisation + Rolle setzen
  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({
      organization_id: invite.organization_id,
      role: invite.role,
    })
    .eq("id", user.id);

  if (updateErr) {
    return NextResponse.json({ error: "Profil konnte nicht aktualisiert werden" }, { status: 500 });
  }

  // Invite als accepted markieren
  await supabaseAdmin
    .from("team_invites")
    .update({ accepted: true })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true });
}
