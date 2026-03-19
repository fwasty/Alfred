import { db } from '../src/lib/sqlite'
import { cuid, now } from '../src/lib/ids'
import { ingestWhopCompanyFromPublicUrl } from '../src/lib/whop'
import { updateGuruFromWhop, upsertCourseFromWhop } from '../src/lib/db'

type Seed = { handle: string; whopUrl: string }

const seeds: Seed[] = [
  { handle: 'motion-network', whopUrl: 'https://whop.com/motion-network/' },
  { handle: 'tactical-futures', whopUrl: 'https://whop.com/tactical-futures/' },
  { handle: 'futures-options-signals', whopUrl: 'https://whop.com/futures-options-signals/' },
  { handle: 'torque-trading-mgc', whopUrl: 'https://whop.com/marketplace/torque-trading-2-0-futures-signals/' },
]

function ensureGuru(handle: string, whopUrl: string) {
  const g = db.prepare('SELECT * FROM gurus WHERE handle = ?').get(handle) as any
  if (g) return g
  const ts = now()
  const id = cuid()
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g, ' '), handle, 'Trading', null, whopUrl, ts, ts)
  return db.prepare('SELECT * FROM gurus WHERE handle = ?').get(handle) as any
}

async function main() {
  for (const s of seeds) {
    const g = ensureGuru(s.handle, s.whopUrl)

    // Normalize whop store url if they gave marketplace/discover URLs
    let url = s.whopUrl
    if (url.includes('/marketplace/') || url.includes('/discover/')) {
      // best-effort: try to find canonical store page URL from og:url
      const html = await (await fetch(url)).text()
      const m = html.match(/property="og:url" content="([^"]+)"/)
      if (m?.[1]) url = m[1]
    }

    const ingest = await ingestWhopCompanyFromPublicUrl(url)

    updateGuruFromWhop(s.handle, {
      whop_url: ingest.whop_url,
      whop_route: ingest.route,
      title: ingest.title,
      bio: ingest.creator_pitch,
      image_url: ingest.logo_url,
      whop_rating: ingest.reviews_average,
      whop_reviews_count: ingest.published_reviews_count,
      whop_star_counts: ingest.review_counts,
      whop_synced_at: Date.now(),
    })

    for (const ap of ingest.access_passes) {
      upsertCourseFromWhop(g.id, {
        whop_url: ap.product_id ? `https://whop.com/${ap.whop_route || ingest.route || ''}/` : null,
        name: ap.title || ap.headline || ap.product_id,
        image_url: ap.image_url,
        price_cents: ap.initial_price_due_cents,
      })
    }

    console.log('Imported', s.handle, ingest.title, ingest.reviews_average, ingest.published_reviews_count)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
