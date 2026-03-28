import { NextResponse } from 'next/server'

const COOKIE = 'sm_beta'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 Tage

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!process.env.BETA_PASSWORD || !process.env.BETA_TOKEN) {
    return NextResponse.json({ error: 'Nicht konfiguriert' }, { status: 503 })
  }

  if (password !== process.env.BETA_PASSWORD) {
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE, process.env.BETA_TOKEN, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return response
}
