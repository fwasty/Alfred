import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findUserByUsername } from '@/lib/db'
import { setSessionCookie, verifyPassword } from '@/lib/auth'

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { username, password } = parsed.data
  const user = findUserByUsername(username)
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  await setSessionCookie(user.id)
  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username } })
}
