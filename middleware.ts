import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BETA_COOKIE = 'sm_beta'
const ADMIN_COOKIE = 'sm_admin'

// Routen die ohne Passwort zugänglich bleiben
const PUBLIC_PATHS = ['/beta-login', '/api/beta-login', '/admin-login', '/api/admin-login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Statische Assets und öffentliche Routen durchlassen
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Admin-Bereich: eigenes Passwort prüfen
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value
    const adminPw = process.env.ADMIN_PASSWORD
    if (adminPw && adminToken !== adminPw) {
      return NextResponse.redirect(new URL('/admin-login', request.url))
    }
    return NextResponse.next()
  }

  // Beta-Schutz für alle anderen Routen
  const token = request.cookies.get(BETA_COOKIE)?.value
  const expected = process.env.BETA_TOKEN

  if (!expected || (token && token === expected)) {
    return NextResponse.next()
  }

  // Kein gültiges Cookie → zur Login-Seite
  const loginUrl = new URL('/beta-login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
