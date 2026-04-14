import { NextResponse } from 'next/server'
import { db } from '@/lib/sqlite'
import { getSessionUserId } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { cuid, now } from '@/lib/ids'

// Claims table
try { db.exec(`
  CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    proof_text TEXT,
    proof_url TEXT,
    created_at INTEGER NOT NULL,
    reviewed_at INTEGER,
    reviewed_by TEXT,
    UNIQUE(user_id, guru_id)
  )
`) } catch {}

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const rl = rateLimit(`claim:${userId}`, 3, 60 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many claims. Try again later.' }, { status: 429 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const guruId = typeof body?.guruId === 'string' ? body.guruId : null
  const proofText = typeof body?.proofText === 'string' ? body.proofText.trim().slice(0, 1000) : null
  const proofUrl = typeof body?.proofUrl === 'string' ? body.proofUrl.trim().slice(0, 500) : null

  if (!guruId) return NextResponse.json({ error: 'guruId required' }, { status: 400 })
  if (!proofText || proofText.length < 10) return NextResponse.json({ error: 'Please describe how you can prove ownership (min 10 chars)' }, { status: 400 })

  const guru = db.prepare('SELECT id, name, claimed_by FROM gurus WHERE id = ? AND COALESCE(hidden,0)=0').get(guruId) as any
  if (!guru) return NextResponse.json({ error: 'Guru not found' }, { status: 404 })
  if (guru.claimed_by) return NextResponse.json({ error: 'This profile is already claimed' }, { status: 409 })

  // Check for existing pending claim
  const existing = db.prepare('SELECT id, status FROM claims WHERE user_id=? AND guru_id=?').get(userId, guruId) as any
  if (existing) {
    if (existing.status === 'pending') return NextResponse.json({ error: 'You already have a pending claim for this profile' }, { status: 409 })
    if (existing.status === 'approved') return NextResponse.json({ error: 'This claim was already approved' }, { status: 409 })
  }

  const ts = now()
  const id = cuid()
  db.prepare('INSERT OR REPLACE INTO claims (id, user_id, guru_id, status, proof_text, proof_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, userId, guruId, 'pending', proofText, proofUrl, ts)

  return NextResponse.json({ ok: true, message: 'Claim submitted! We will review it within 24-48 hours.' })
}

// Admin endpoint to approve claims (called manually for now)
export async function PUT(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  // TODO: proper admin check. For now, check if user is the first registered user (Seth)
  const user = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get() as any
  if (!user || user.id !== userId) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const claimId = typeof body?.claimId === 'string' ? body.claimId : null
  const action = typeof body?.action === 'string' ? body.action : null
  if (!claimId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'claimId and action (approve/reject) required' }, { status: 400 })
  }

  const claim = db.prepare('SELECT * FROM claims WHERE id=?').get(claimId) as any
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 })

  const ts = now()

  if (action === 'approve') {
    db.prepare('UPDATE claims SET status=?, reviewed_at=?, reviewed_by=? WHERE id=?')
      .run('approved', ts, userId, claimId)
    db.prepare('UPDATE gurus SET claimed_by=?, claimed_at=?, verified=1, updated_at=? WHERE id=?')
      .run(claim.user_id, ts, ts, claim.guru_id)
    return NextResponse.json({ ok: true, message: 'Claim approved. Profile is now verified.' })
  } else {
    db.prepare('UPDATE claims SET status=?, reviewed_at=?, reviewed_by=? WHERE id=?')
      .run('rejected', ts, userId, claimId)
    return NextResponse.json({ ok: true, message: 'Claim rejected.' })
  }
}
