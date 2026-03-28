import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { Badge, Card } from '@/components/ui'
import { listGurus } from '@/lib/db'
import { CATEGORIES } from '@/lib/categories'
import { GuruCard } from '@/components/GuruCard'
import { db } from '@/lib/sqlite'

export default async function GurusPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (searchParams ? await searchParams : {}) as any
  const catRaw = typeof sp?.cat === 'string' ? sp.cat : 'All'
  const cat = (CATEGORIES as readonly string[]).includes(catRaw) ? catRaw : 'All'

  let gurus = listGurus({ category: cat === 'All' ? null : cat })

  // Auto-sync a few missing Whop profiles
  try {
    const { ingestWhopCompanyFromPublicUrl } = await import('@/lib/whop')
    const { updateGuruFromWhop, upsertCourseFromWhop } = await import('@/lib/db')

    let synced = 0
    for (const g of gurus) {
      if (synced >= 3) break
      if (!g.whop_url) continue
      if (g.whop_synced_at) continue
      const ingest = await ingestWhopCompanyFromPublicUrl(g.whop_url)
      updateGuruFromWhop(g.handle || '', {
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
          whop_rating: ap.reviews_average,
          whop_reviews_count: ap.published_reviews_count,
          whop_star_counts: ap.review_counts,
          summary: ap.summary,
          whop_synced_at: Date.now(),
        })
      }
      synced++
    }
    if (synced) gurus = listGurus()
  } catch {
    // ignore
  }

  const totalGurus = (db.prepare("SELECT COUNT(*) as c FROM gurus WHERE COALESCE(hidden,0)=0").get() as {c:number}).c

  return (
    <Shell>
      <div className="grid gap-8">

        {/* Header */}
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-8 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text)] md:text-4xl">Browse Gurus</h1>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {totalGurus.toLocaleString()} creators indexed from Whop. Filter by category, sorted by review count.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">{gurus.length} results</span>
            </div>
          </div>

          {/* Category filter */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={c === 'All' ? '/gurus' : `/gurus?cat=${encodeURIComponent(c)}`}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${
                  c === cat
                    ? 'bg-[color:var(--accent)] text-white shadow-sm'
                    : 'border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-[color:var(--text)]'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gurus.map((g) => (
            <GuruCard key={g.id} guru={g} />
          ))}

          {gurus.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3 text-sm text-[color:var(--muted)] text-center py-12">
              No gurus found in this category.
            </Card>
          ) : null}
        </div>

      </div>
    </Shell>
  )
}
