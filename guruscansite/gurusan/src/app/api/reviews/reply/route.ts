import { NextResponse } from 'next/server'
import { db } from '@/lib/sqlite'
import { getSessionUserId } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { now } from '@/lib/ids'

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const rl = rateLimit(`reply:${userId}`, 20, 60 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many replies. Slow down.' }, { status: 429 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const reviewId = typeof body?.reviewId === 'string' ? body.reviewId : null
  const replyText = typeof body?.reply === 'string' ? body.reply.trim().slice(0, 1000) : null

  if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
  if (!replyText || replyText.length < 5) return NextResponse.json({ error: 'Reply must be at least 5 characters' }, { status: 400 })

  // Check that the user has claimed the guru this review belongs to
  const review = db.prepare('SELECT id, guru_id FROM reviews WHERE id=?').get(reviewId) as any
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const guru = db.prepare('SELECT claimed_by, name FROM gurus WHERE id=?').get(review.guru_id) as any
  if (!guru || guru.claimed_by !== userId) {
    return NextResponse.json({ error: 'Only the verified profile owner can reply to reviews' }, { status: 403 })
  }

  const ts = now()
  db.prepare('UPDATE reviews SET reply=?, reply_at=?, reply_by=? WHERE id=?')
    .run(replyText, ts, userId, reviewId)

  return NextResponse.json({ ok: true })
}
