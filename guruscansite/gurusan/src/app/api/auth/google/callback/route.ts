import { NextResponse } from 'next/server'
import { setSessionCookie, hashPassword } from '@/lib/auth'
import { db } from '@/lib/sqlite'
import { cuid, now } from '@/lib/ids'

function getBaseUrl(req: Request) {
  const env = process.env.BASE_URL
  if (env) return env.replace(/\/$/, '')
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

function sanitizeUsername(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '')
    .slice(0, 24)
}

function makeUniqueUsername(base: string) {
  let u = base || `user${Math.floor(Math.random() * 9999)}`
  u = sanitizeUsername(u)
  if (!u) u = `user${Math.floor(Math.random() * 9999)}`

  const exists = (name: string) => !!db.prepare('SELECT 1 FROM users WHERE username = ? LIMIT 1').get(name)
  if (!exists(u)) return u

  for (let i = 2; i < 200; i++) {
    const cand = sanitizeUsername(`${u}${i}`)
    if (!exists(cand)) return cand
  }
  return `${u}${Date.now().toString().slice(-4)}`
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google login is not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).' }, { status: 500 })
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const jar = req.headers.get('cookie') || ''
  const cookieState = jar.match(/(?:^|;\s*)google_oauth_state=([^;]+)/)?.[1]
  const next = jar.match(/(?:^|;\s*)login_next=([^;]+)/)?.[1]

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(`${getBaseUrl(req)}/login?error=oauth_state`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${getBaseUrl(req)}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokenJson = (await tokenRes.json().catch(() => null)) as any
  if (!tokenRes.ok || !tokenJson?.access_token) {
    return NextResponse.redirect(`${getBaseUrl(req)}/login?error=oauth_token`)
  }

  // Fetch user info
  const meRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })
  const me = (await meRes.json().catch(() => null)) as any
  if (!meRes.ok || !me?.sub) {
    return NextResponse.redirect(`${getBaseUrl(req)}/login?error=oauth_userinfo`)
  }

  // Ensure columns exist + indexes (lightweight migration)
  try {
    db.exec('ALTER TABLE users ADD COLUMN google_sub TEXT')
  } catch {}
  try {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)')
  } catch {}

  const existing = db.prepare('SELECT * FROM users WHERE google_sub = ? LIMIT 1').get(me.sub) as any
  let userId: string

  if (existing?.id) {
    userId = existing.id
  } else {
    const email: string | null = typeof me.email === 'string' ? me.email : null
    const base = email ? email.split('@')[0] : (typeof me.name === 'string' ? me.name.split(' ')[0] : 'user')
    const username = makeUniqueUsername(base)

    // Create a random password hash so password-login isn't possible unless we build an account-link flow later.
    const randomPw = cuid() + cuid()
    const password_hash = await hashPassword(randomPw)

    const ts = now()
    userId = cuid()

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, google_sub, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, username, email, password_hash, me.sub, ts, ts)
  }

  // Clear oauth cookies + set session
  const res = NextResponse.redirect(`${getBaseUrl(req)}${next ? decodeURIComponent(next) : '/gurus'}`)
  res.cookies.set('google_oauth_state', '', { httpOnly: true, path: '/', maxAge: 0 })
  res.cookies.set('login_next', '', { httpOnly: true, path: '/', maxAge: 0 })

  // Use our existing session cookie system
  await setSessionCookie(userId)
  return res
}
