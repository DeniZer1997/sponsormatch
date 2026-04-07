import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await req.json();
    const { organizerEmail, sponsorName, eventName, logoUrls, videoUrls, fileUrls } = body;

    if (!organizerEmail || !sponsorName || !eventName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const total = (logoUrls?.length || 0) + (videoUrls?.length || 0) + (fileUrls?.length || 0);

    const html = `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#1a1814">
        <div style="background:#07929B;padding:1.5rem;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:1.3rem">Sponsor-Material eingegangen</h1>
        </div>
        <div style="background:#f8f7f4;padding:1.5rem;border-radius:0 0 12px 12px;border:1px solid #e8e4dd;border-top:none">
          <p style="margin:0 0 1rem">
            Sponsor <strong>${sponsorName}</strong> hat Materialien für
            <strong>${eventName}</strong> hochgeladen.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:1rem">
            ${logoUrls?.length ? `<tr><td style="padding:0.4rem 0;color:#6b6560;font-size:0.9rem">Logos</td><td style="font-weight:700">${logoUrls.length}</td></tr>` : ""}
            ${videoUrls?.length ? `<tr><td style="padding:0.4rem 0;color:#6b6560;font-size:0.9rem">Videos</td><td style="font-weight:700">${videoUrls.length}</td></tr>` : ""}
            ${fileUrls?.length ? `<tr><td style="padding:0.4rem 0;color:#6b6560;font-size:0.9rem">Dateien</td><td style="font-weight:700">${fileUrls.length}</td></tr>` : ""}
            <tr style="border-top:1px solid #e8e4dd"><td style="padding:0.6rem 0;font-weight:700">Gesamt</td><td style="font-weight:700;color:#07929B">${total} Dateien</td></tr>
          </table>
          <p style="color:#6b6560;font-size:0.85rem;margin:0">
            Öffne SponsorMatch → Pipeline → Vereinbarung, um die Materialien zu prüfen.
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "SponsorMatch <onboarding@resend.dev>",
      to: organizerEmail,
      subject: `Material vollständig: ${sponsorName} — ${eventName}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}
