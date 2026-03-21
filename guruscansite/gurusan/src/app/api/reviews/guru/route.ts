import { NextResponse } from 'next/server'
import { db } from '@/lib/sqlite'
import { getSessionUserId } from '@/lib/auth'
import { cuid, now } from '@/lib/ids'

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

  const guruId = typeof body?.guruId === 'string' ? body.guruId : null
  const rating = Number(body?.rating)
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : null
  const text = typeof body?.body === 'string' ? body.body.trim().slice(0, 2000) : ''
  const anonymous = !!body?.anonymous

  if (!guruId) return NextResponse.json({ error: 'guruId required' }, { status: 400 })
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 })
  }
  if (text.length < 20) return NextResponse.json({ error: 'Review must be at least 20 characters' }, { status: 400 })

  const guru = db
    .prepare('SELECT id FROM gurus WHERE id = ? AND COALESCE(hidden,0)=0 LIMIT 1')
    .get(guruId) as any
  if (!guru) return NextResponse.json({ error: 'Guru not found' }, { status: 404 })

  const ts = now()

  // Check for existing review (one per user per guru, no course)
  const existing = db
    .prepare('SELECT id FROM reviews WHERE user_id = ? AND guru_id = ? AND course_id IS NULL LIMIT 1')
    .get(userId, guruId) as any

  if (existing?.id) {
    db.prepare(
      'UPDATE reviews SET rating=?, title=?, body=?, anonymous=?, updated_at=? WHERE id=?'
    ).run(rating, title, text, anonymous ? 1 : 0, ts, existing.id)
  } else {
    const id = cuid()
    db.prepare(
      `INSERT INTO reviews (id, user_id, guru_id, course_id, rating, title, body, anonymous, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, guruId, rating, title, text, anonymous ? 1 : 0, ts, ts)
  }

  // Recalculate guru rating
  const agg = db.prepare(
    `SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE guru_id = ? AND course_id IS NULL`
  ).get(guruId) as { avg_rating: number | null; count: number }

  db.prepare(
    'UPDATE gurus SET guru_rating = ?, guru_reviews_count = ?, updated_at = ? WHERE id = ?'
  ).run(agg.avg_rating, agg.count, ts, guruId)

  return NextResponse.json({ ok: true, guru_rating: agg.avg_rating, guru_reviews_count: agg.count })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const guruId = url.searchParams.get('guruId')
  if (!guruId) return NextResponse.json({ error: 'guruId required' }, { status: 400 })

  const reviews = db.prepare(`
    SELECT r.id, r.rating, r.title, r.body, r.anonymous, r.created_at, r.updated_at,
           CASE WHEN r.anonymous = 1 THEN 'Anonymous' ELSE u.username END as username
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.guru_id = ? AND r.course_id IS NULL
    ORDER BY r.created_at DESC
    LIMIT 50
  `).all(guruId)

  return NextResponse.json({ data: reviews })
}
