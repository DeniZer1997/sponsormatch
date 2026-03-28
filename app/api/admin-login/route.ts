import { NextResponse } from 'next/server'

const COOKIE = 'sm_admin'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 Stunden

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Nicht konfiguriert' }, { status: 503 })
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE, process.env.ADMIN_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return response
}
