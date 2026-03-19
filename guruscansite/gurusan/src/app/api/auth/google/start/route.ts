import { NextResponse } from 'next/server'
import crypto from 'crypto'

function getBaseUrl(req: Request) {
  const env = process.env.BASE_URL
  if (env) return env.replace(/\/$/, '')
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google login is not configured (missing GOOGLE_CLIENT_ID).' }, { status: 500 })
  }

  const next = new URL(req.url).searchParams.get('next') || '/gurus'

  const state = crypto.randomBytes(24).toString('base64url')
  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${getBaseUrl(req)}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
        state,
      }).toString()
  )

  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })
  res.cookies.set('login_next', next, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })

  return res
}
