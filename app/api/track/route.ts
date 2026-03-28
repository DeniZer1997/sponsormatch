import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { page, eventName, type } = await request.json()

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const now = new Date().toISOString()

    // Upsert current activity
    await supabaseAdmin.from('user_activity').upsert({
      user_id: user.id,
      email: user.email,
      current_page: page || 'dashboard',
      current_event: eventName || null,
      last_seen: now,
      ...(type === 'login' ? { logged_in_at: now } : {}),
    }, { onConflict: 'user_id' })

    // Log login event separately
    if (type === 'login') {
      await supabaseAdmin.from('login_events').insert({
        user_id: user.id,
        email: user.email,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
