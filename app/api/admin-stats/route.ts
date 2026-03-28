import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

export async function GET() {
  // Check auth
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: allUsers },
    { data: recentLogins },
    { count: loginsToday },
    { count: loginsWeek },
  ] = await Promise.all([
    supabaseAdmin.from('user_activity').select('*').order('last_seen', { ascending: false }),
    supabaseAdmin.from('login_events').select('*').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('login_events').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabaseAdmin.from('login_events').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
  ])

  const activeNow = (allUsers || []).filter(u => u.last_seen >= tenMinAgo)

  return NextResponse.json({
    activeNow,
    allUsers: allUsers || [],
    loginsToday: loginsToday || 0,
    loginsWeek: loginsWeek || 0,
    recentLogins: recentLogins || [],
  })
}
