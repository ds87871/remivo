import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('remivo_session')?.value
  const secret = process.env.ADMIN_PASSWORD || 'default_admin_password_secret_123!'

  const isValid = sessionCookie ? await verifyToken(sessionCookie, secret) : false

  if (!isValid) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
