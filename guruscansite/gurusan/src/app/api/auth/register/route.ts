import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createUser, findUserByUsernameOrEmail } from '@/lib/db'
import { hashPassword, setSessionCookie } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const schema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(72),
  email: z.string().email().optional().or(z.literal('')),
})

export async function POST(req: Request) {
  // Rate limit: 5 registrations per hour per IP
  const ip = getClientIp(req)
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many signups from this IP. Try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { username, password } = parsed.data
  const email = parsed.data.email?.trim() || null

  const existing = findUserByUsernameOrEmail(username, email)
  if (existing) {
    return NextResponse.json({ error: 'Username or email already in use' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const user = createUser({ username, email, password_hash: passwordHash })

  await setSessionCookie(user.id)
  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username } })
}
