import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'E-Mail-Versand nicht konfiguriert' }, { status: 503 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Auth prüfen
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, subject, html, replyTo } = await request.json()

  // Validierung
  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
  }

  // E-Mail-Format validieren
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'SponsorMatch <noreply@sponsormatch-iota.vercel.app>',
      to,
      subject,
      html,
      replyTo: replyTo || undefined,
    })

    if (error) throw error
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'E-Mail konnte nicht gesendet werden'
    console.error('Resend error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
