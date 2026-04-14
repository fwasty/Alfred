#!/usr/bin/env node
/**
 * Nightly Whop Sync — fetches latest ratings/reviews for all gurus from Whop.
 * 
 * Usage: node scripts/nightly_sync.cjs [--limit N] [--stale-hours H]
 * 
 * - Processes gurus that haven't been synced in --stale-hours (default 20h)
 * - Rate-limited to avoid hammering Whop (1 request per 2 seconds)
 * - Logs progress to stdout
 */

const Database = require('better-sqlite3')
const path = require('path')

const args = process.argv.slice(2)
const limitArg = args.indexOf('--limit')
const staleArg = args.indexOf('--stale-hours')
const MAX_GURUS = limitArg !== -1 ? parseInt(args[limitArg + 1]) || 999 : 999
const STALE_HOURS = staleArg !== -1 ? parseInt(args[staleArg + 1]) || 20 : 20
const DELAY_MS = 2000 // 2 seconds between requests

const dbPath = path.join(__dirname, '..', 'gurusan.db')
const db = new Database(dbPath)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function rx1(raw, re) {
  const m = raw.match(re)
  return m?.[1] ?? null
}

function extractBracketed(raw, startIdx, open, close) {
  let i = startIdx
  while (i < raw.length && raw[i] !== open) i++
  if (i >= raw.length) return null
  let depth = 0
  const begin = i
  for (; i < raw.length; i++) {
    if (raw[i] === open) depth++
    else if (raw[i] === close) {
      depth--
      if (depth === 0) return raw.slice(begin, i + 1)
    }
  }
  return null
}

async function fetchWhopData(whopUrl) {
  const res = await fetch(whopUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) return null
  const html = await res.text()

  const reviews_average = (() => {
    const v = rx1(html, /reviewsAverage\\":(\d+(?:\.\d+)?)/) || rx1(html, /"reviewsAverage":(\d+(?:\.\d+)?)/)
    return v ? Number(v) : null
  })()

  const published_reviews_count = (() => {
    const v = rx1(html, /publishedReviewsCount\\":(\d+)/) || rx1(html, /"publishedReviewsCount":(\d+)/)
    return v ? Number(v) : null
  })()

  const review_counts = (() => {
    const v = rx1(html, /reviewCounts\\":\[(\d+(?:,\d+){4})\]/) || rx1(html, /"reviewCounts":\[(\d+(?:,\d+){4})\]/)
    return v ? v.split(',').map(n => Number(n.trim())) : null
  })()

  const title = rx1(html, /company\\":\{[^}]*?title\\":\\"([^\\"]+)/) ||
    rx1(html, /"company":\{[^}]*?"title":"([^"]+)/)

  const bio = rx1(html, /creatorPitch\\":\\"([^\\"]+)/) || rx1(html, /"creatorPitch":"([^"]+)/)

  // Parse access passes for course-level data
  const courses = []
  const apIdx = html.indexOf('accessPasses')
  if (apIdx !== -1) {
    const arr = extractBracketed(html, apIdx, '[', ']')
    if (arr) {
      try {
        const json = JSON.parse(arr.replace(/\\"/g, '"'))
        for (const p of json) {
          const dp = p?.defaultPlan
          courses.push({
            product_id: String(p?.id || ''),
            title: p?.title ?? null,
            headline: p?.headline ?? null,
            image_url: p?.filePicture?.sourceUrl ?? p?.image?.sourceUrl ?? null,
            price_cents: typeof dp?.initialPriceDueInCents === 'number' ? dp.initialPriceDueInCents : null,
            reviews_average: typeof p?.reviewsAverage === 'number' ? p.reviewsAverage : null,
            published_reviews_count: typeof p?.publishedReviewsCount === 'number' ? p.publishedReviewsCount : null,
            review_counts: Array.isArray(p?.reviewCounts) ? p.reviewCounts.map(Number) : null,
            route: p?.route ?? null,
          })
        }
      } catch {}
    }
  }

  return { reviews_average, published_reviews_count, review_counts, title, bio, courses }
}

async function main() {
  const staleMs = STALE_HOURS * 60 * 60 * 1000
  const cutoff = Date.now() - staleMs

  const gurus = db.prepare(`
    SELECT id, name, handle, whop_url, whop_synced_at 
    FROM gurus 
    WHERE COALESCE(hidden,0)=0 
      AND whop_url IS NOT NULL 
      AND (whop_synced_at IS NULL OR whop_synced_at < ?)
    ORDER BY COALESCE(whop_reviews_count,0) DESC
    LIMIT ?
  `).all(cutoff, MAX_GURUS)

  console.log(`[nightly_sync] Starting — ${gurus.length} gurus to sync (stale >${STALE_HOURS}h, limit ${MAX_GURUS})`)

  const updateGuru = db.prepare(`
    UPDATE gurus SET
      whop_rating = COALESCE(?, whop_rating),
      whop_reviews_count = COALESCE(?, whop_reviews_count),
      whop_star_counts = COALESCE(?, whop_star_counts),
      name = COALESCE(?, name),
      bio = COALESCE(?, bio),
      whop_synced_at = ?,
      updated_at = ?
    WHERE id = ?
  `)

  const upsertCourse = db.prepare(`
    UPDATE courses SET
      whop_rating = COALESCE(?, whop_rating),
      whop_reviews_count = COALESCE(?, whop_reviews_count),
      whop_star_counts = COALESCE(?, whop_star_counts),
      whop_synced_at = ?,
      updated_at = ?
    WHERE guru_id = ? AND lower(TRIM(name)) = lower(TRIM(?))
  `)

  let synced = 0
  let failed = 0

  for (const g of gurus) {
    try {
      const data = await fetchWhopData(g.whop_url)
      if (!data) {
        console.log(`  [SKIP] ${g.name} — fetch failed`)
        failed++
        await sleep(DELAY_MS)
        continue
      }

      // SAFETY: Never save Vercel security page data as real data
      if (data.title && (data.title.includes('Vercel') || data.title.includes('Security Checkpoint') || data.title.includes('Discover | Whop'))) {
        console.log(`  [BLOCKED] ${g.name} — got Vercel security page, skipping`)
        failed++
        await sleep(DELAY_MS)
        continue
      }

      const now = Date.now()
      updateGuru.run(
        data.reviews_average,
        data.published_reviews_count,
        data.review_counts ? JSON.stringify(data.review_counts) : null,
        data.title,
        data.bio,
        now,
        now,
        g.id
      )

      // Update course-level ratings
      for (const c of data.courses) {
        const courseName = c.title || c.headline
        if (!courseName) continue
        upsertCourse.run(
          c.reviews_average,
          c.published_reviews_count,
          c.review_counts ? JSON.stringify(c.review_counts) : null,
          now,
          now,
          g.id,
          courseName
        )
      }

      synced++
      const rating = data.reviews_average != null ? data.reviews_average.toFixed(1) : '—'
      const reviews = data.published_reviews_count ?? 0
      console.log(`  [OK] ${g.name} — ${rating}★ (${reviews} reviews, ${data.courses.length} courses)`)

      await sleep(DELAY_MS)
    } catch (err) {
      console.log(`  [ERR] ${g.name} — ${err.message}`)
      failed++
      await sleep(DELAY_MS)
    }
  }

  console.log(`[nightly_sync] Done — ${synced} synced, ${failed} failed, ${gurus.length - synced - failed} skipped`)

  // Take daily snapshot for trending
  const today = new Date().toISOString().slice(0, 10)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS guru_snapshots (id TEXT PRIMARY KEY, guru_id TEXT NOT NULL, whop_rating REAL, whop_reviews_count INTEGER, snapshot_date TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(guru_id, snapshot_date))`)
    const allGurus = db.prepare('SELECT id, whop_rating, whop_reviews_count FROM gurus WHERE COALESCE(hidden,0)=0 AND whop_reviews_count > 0').all()
    const ins = db.prepare('INSERT OR IGNORE INTO guru_snapshots (id, guru_id, whop_rating, whop_reviews_count, snapshot_date, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    let snapped = 0
    for (const g of allGurus) {
      ins.run(require('crypto').randomBytes(16).toString('hex'), g.id, g.whop_rating, g.whop_reviews_count, today, Date.now())
      snapped++
    }
    console.log(`[nightly_sync] Snapshot: ${snapped} gurus for ${today}`)
  } catch (e) { console.log('[nightly_sync] Snapshot error:', e.message) }
}

main().catch(err => {
  console.error('[nightly_sync] Fatal:', err)
  process.exit(1)
})
