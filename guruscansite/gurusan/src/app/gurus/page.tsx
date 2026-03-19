import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { Badge, Card } from '@/components/ui'
import { listGurus } from '@/lib/db'
import { CATEGORIES } from '@/lib/categories'
import { GuruCard } from '@/components/GuruCard'

export default async function GurusPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (searchParams ? await searchParams : {}) as any
  const catRaw = typeof sp?.cat === 'string' ? sp.cat : 'All'
  const cat = (CATEGORIES as readonly string[]).includes(catRaw) ? catRaw : 'All'

  let gurus = listGurus({ category: cat === 'All' ? null : cat })

  // Auto-sync a few missing Whop profiles so the browse page shows images/ratings without manual clicking.
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

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Browse</h1>
          <p className="mt-2 text-sm text-neutral-600">Browse Whop offers by creator. Filter by category and sort by popularity.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>All categories</Badge>
            <Badge>Whop-sourced ratings</Badge>
            <Badge className="bg-indigo-50">Reviews coming soon</Badge>
          </div>
        </div>
        <Link className="text-sm text-neutral-600 underline-offset-4 hover:underline" href="/">
          Back home
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={c === 'All' ? '/gurus' : `/gurus?cat=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-2 text-xs border border-black/10 bg-white/60 hover:bg-white ${c === cat ? 'text-neutral-900 font-semibold' : 'text-neutral-700'}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {gurus.map((g) => (
          <GuruCard key={g.id} guru={g} />
        ))}

        {gurus.length === 0 ? (
          <Card className="text-sm text-neutral-700">No gurus yet.</Card>
        ) : null}
      </div>
    </Shell>
  )
}
