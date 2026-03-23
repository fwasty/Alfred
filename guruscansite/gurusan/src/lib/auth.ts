import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'gurusan_session'

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-me'
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function makeSessionToken(userId: string) {
  // simple signed token: base64(userId).sig
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function parseSessionToken(token: string | undefined | null): { userId: string } | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const obj = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof obj.userId !== 'string') return null
    return { userId: obj.userId }
  } catch {
    return null
  }
}

export async function setSessionCookie(userId: string) {
  const token = makeSessionToken(userId)
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Always secure in production (behind Cloudflare HTTPS even if origin is HTTP)
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  const parsed = parseSessionToken(token)
  return parsed?.userId ?? null
}
