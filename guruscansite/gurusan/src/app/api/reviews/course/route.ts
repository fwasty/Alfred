import { NextResponse } from 'next/server'
import { db } from '@/lib/sqlite'
import { getSessionUserId } from '@/lib/auth'
import crypto from 'crypto'

function cuid() {
  // small unique id (good enough for sqlite here)
  return crypto.randomBytes(16).toString('hex')
}

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body?.courseId === 'string' ? body.courseId : null
  const rating = Number(body?.rating)
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : null
  const text = typeof body?.body === 'string' ? body.body.trim().slice(0, 2000) : ''
  const anonymous = !!body?.anonymous

  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 })
  }
  if (text.length < 40) return NextResponse.json({ error: 'Review too short' }, { status: 400 })

  const course = db
    .prepare('SELECT id, guru_id FROM courses WHERE id = ? AND COALESCE(hidden,0)=0 LIMIT 1')
    .get(courseId) as any
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Reviews table currently has: id,user_id,guru_id,course_id,rating,title,body,created_at,updated_at
  // We encode anonymity in the title prefix for now? Better: add column. We'll do lightweight migration here.
  try {
    db.exec('ALTER TABLE reviews ADD COLUMN anonymous INTEGER NOT NULL DEFAULT 0')
  } catch {
    // already exists
  }

  const ts = Date.now()

  const existing = db
    .prepare('SELECT id FROM reviews WHERE user_id = ? AND course_id = ? LIMIT 1')
    .get(userId, courseId) as any

  if (existing?.id) {
    db.prepare(
      'UPDATE reviews SET rating=?, title=?, body=?, anonymous=?, updated_at=? WHERE id=?'
    ).run(rating, title, text, anonymous ? 1 : 0, ts, existing.id)
  } else {
    const id = cuid()
    db.prepare(
      `INSERT INTO reviews (id, user_id, guru_id, course_id, rating, title, body, anonymous, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, course.guru_id, courseId, rating, title, text, anonymous ? 1 : 0, ts, ts)
  }

  return NextResponse.json({ ok: true })
}
