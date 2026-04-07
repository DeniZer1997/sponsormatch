import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/team/invite?token=xxx — Invite-Details für Landing-Page
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token fehlt" }, { status: 400 });

  const { data: invite, error } = await supabaseAdmin
    .from("team_invites")
    .select("id, email, role, accepted, organization_id, invited_by, expires_at")
    .eq("token", token)
    .single();

  if (error || !invite) return NextResponse.json({ error: "Einladung nicht gefunden oder abgelaufen" }, { status: 404 });
  if (invite.accepted) return NextResponse.json({ error: "Diese Einladung wurde bereits angenommen" }, { status: 410 });
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Diese Einladung ist abgelaufen" }, { status: 410 });
  }

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("name")
    .eq("id", invite.organization_id)
    .single();

  const { data: inviter } = await supabaseAdmin
    .from("profiles")
    .select("name, display_name")
    .eq("id", invite.invited_by)
    .single();

  return NextResponse.json({
    orgName: org?.name ?? "Unbekannte Organisation",
    invitedByName: inviter?.display_name || inviter?.name || "Jemand",
    role: invite.role,
  });
}

// POST /api/team/invite — Einladung erstellen + E-Mail senden
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "E-Mail fehlt" }, { status: 400 });

  // Org + Admin-Check
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id, role, name, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) return NextResponse.json({ error: "Keine Organisation gefunden" }, { status: 400 });
  if (profile.role !== "admin") return NextResponse.json({ error: "Nur Admins können einladen" }, { status: 403 });

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .single();

  // Invite erstellen (upsert — verhindert Duplikate)
  const { data: invite, error: insertErr } = await supabaseAdmin
    .from("team_invites")
    .upsert({
      organization_id: profile.organization_id,
      invited_by: user.id,
      email: email.trim().toLowerCase(),
      role: "member",
      accepted: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "organization_id,email" })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // E-Mail senden
  const inviterName = profile.display_name || profile.name || "Dein Admin";
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sponsormatch-iota.vercel.app"}/invite?token=${invite.token}`;

  const html = `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;color:#1a1814">
      <div style="background:#e8500a;padding:1.5rem;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:1.2rem;font-family:Georgia,serif">Einladung zu SponsorMatch</h1>
      </div>
      <div style="background:#f8f7f4;padding:1.5rem;border-radius:0 0 12px 12px;border:1px solid #e8e4dd;border-top:none">
        <p style="margin:0 0 1rem"><strong>${inviterName}</strong> hat dich eingeladen, der Organisation <strong>${org?.name}</strong> auf SponsorMatch beizutreten.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#e8500a;color:#fff;text-decoration:none;border-radius:10px;padding:0.85rem 2rem;font-weight:700;font-size:0.95rem;margin-bottom:1rem">Einladung annehmen</a>
        <p style="font-size:0.82rem;color:#6b6560;margin:0">Oder kopiere diesen Link: ${inviteUrl}</p>
      </div>
    </div>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: "SponsorMatch <onboarding@resend.dev>",
    to: email.trim(),
    subject: `${inviterName} lädt dich zu ${org?.name} ein`,
    html,
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    return NextResponse.json({ error: `E-Mail konnte nicht gesendet werden: ${emailError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
