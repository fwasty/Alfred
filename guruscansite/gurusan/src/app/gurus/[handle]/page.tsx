import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { Badge, Card, Button } from '@/components/ui'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { RatingDistribution } from '@/components/RatingDistribution'
import { GuruReviewForm } from '@/components/GuruReviewForm'
import { GuruReviewList } from '@/components/GuruReviewList'
import { JsonLd, guruJsonLd } from '@/components/JsonLd'
import { ShareButtons } from '@/components/ShareButtons'
import { getGuruByHandle, listCoursesForGuru, getWhopAggregateForGuru } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'
import { pickCreatorAt } from '@/lib/handles'

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const guru = getGuruByHandle(handle)
  if (!guru) return { title: 'Not Found' }
  const name = guru.creator_name?.trim() || guru.handle || guru.name
  const rating = guru.whop_rating != null ? `${guru.whop_rating.toFixed(1)}★` : ''
  return {
    title: `${name} ${rating} — Reviews & Rating`,
    description: guru.bio || `See reviews, ratings, and courses for ${name} on Guru Scan.`,
    openGraph: {
      title: `${name} — Guru Scan`,
      description: guru.bio || `Reviews and ratings for ${name}`,
      images: guru.image_url ? [{ url: guru.image_url }] : undefined,
    },
  }
}

export default async function GuruPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  let guru = getGuruByHandle(handle)
  if (!guru) return notFound()

  // Auto-sync public Whop signals if missing or stale (keeps the page populated without manual clicks)
  try {
    const staleMs = 1000 * 60 * 60 * 12 // 12h
    const needsSync = !!guru.whop_url && (!guru.whop_synced_at || Date.now() - guru.whop_synced_at > staleMs)
    if (needsSync) {
      const { ingestWhopCompanyFromPublicUrl } = await import('@/lib/whop')
      const { updateGuruFromWhop, upsertCourseFromWhop } = await import('@/lib/db')
      const ingest = await ingestWhopCompanyFromPublicUrl(guru.whop_url!)
      updateGuruFromWhop(handle, {
        whop_url: ingest.whop_url,
        whop_route: ingest.route,
        title: ingest.title,
        bio: ingest.creator_pitch,
        image_url: ingest.logo_url,
        creator_image_url: ingest.logo_url,
        instagram_url: ingest.socials.instagram_url,
        tiktok_url: ingest.socials.tiktok_url,
        youtube_url: ingest.socials.youtube_url,
        twitter_url: ingest.socials.twitter_url,
        website_url: ingest.socials.website_url,
        whop_rating: ingest.reviews_average,
        whop_reviews_count: ingest.published_reviews_count,
        whop_star_counts: ingest.review_counts,
        whop_synced_at: Date.now(),
      })
      for (const ap of ingest.access_passes) {
        upsertCourseFromWhop(guru.id, {
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
      guru = getGuruByHandle(handle) ?? guru
    }
  } catch {
    // ignore sync errors; page can still render with existing stored data
  }

  const courses = listCoursesForGuru(guru.id)
  const whopAgg = getWhopAggregateForGuru(guru.id)
  const userId = await getSessionUserId()

  // Default display name = Whop handle unless claimed/customized.
  const displayName = (guru.creator_name && guru.creator_name.trim()) || guru.handle || guru.name

  return (
    <Shell>
      <JsonLd data={guruJsonLd(guru)} />
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src={guru.image_url || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(guru.handle || guru.name)}`}
              alt={displayName}
              className="size-14 shrink-0 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] object-cover object-top sm:size-16"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
                <VerifiedBadge verified={!!guru.verified} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
                <span className="truncate">@{guru.handle ?? 'no-handle'}</span>
                {pickCreatorAt(guru) ? (
                  <>
                    <span>•</span>
                    <span className="truncate">{pickCreatorAt(guru)}</span>
                  </>
                ) : null}
                <span>•</span>
                <span className="truncate">{guru.category}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span title="Category is inferred from the Whop listing / seed data.">
                  <Badge className="bg-[color:var(--surface)]">Category: {guru.category}</Badge>
                </span>
                <span title="Review volume tier, based on total Whop reviews across offers.">
                  <Badge className="bg-[color:var(--surface)]">
                    Whop reviews: {whopAgg.total_reviews >= 1000 ? '1k+' : whopAgg.total_reviews >= 500 ? '500+' : whopAgg.total_reviews >= 100 ? '100+' : whopAgg.total_reviews >= 50 ? '50+' : whopAgg.total_reviews > 0 ? '<50' : '-'}
                  </Badge>
                </span>
                <span title="We show Whop rating separately from Guru Scan rating.">
                  <Badge className="bg-[color:var(--surface)]">Two-score system</Badge>
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareButtons name={displayName} handle={guru.handle || ''} />
            <Link href="/gurus">
              <Button variant="ghost">Back</Button>
            </Link>
            {guru.whop_url ? (
              <a href={guru.whop_url} target="_blank" rel="noreferrer">
                <Button>Whop</Button>
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              {guru.verified ? <Badge className="bg-sky-50">Verified</Badge> : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div
                title="Whop rating: weighted average across offers, using public Whop review counts."
                className={`rounded-2xl px-4 py-3 ${whopAgg.avg_rating && whopAgg.avg_rating >= 4.5 ? 'bg-emerald-500 text-white' : 'bg-lime-400 text-[color:var(--text)]'}`}
              >
                <div className="text-xs font-semibold tracking-wide">WHOP (ALL OFFERS)</div>
                <div className="mt-1 text-3xl font-semibold">{whopAgg.avg_rating != null ? whopAgg.avg_rating.toFixed(2) : '-'}</div>
                <div className="mt-1 text-xs opacity-80">{whopAgg.total_reviews ? `${whopAgg.total_reviews} reviews` : 'no data'}</div>
              </div>
              <div
                title="Guru Scan rating: ratings left on Guru Scan (coming soon)."
                className={`rounded-2xl px-4 py-3 ${guru.guru_rating && guru.guru_rating >= 4.5 ? 'bg-emerald-500 text-white' : 'bg-[color:var(--surface-2)] text-[color:var(--text)]'}`}
              >
                <div className="text-xs font-semibold tracking-wide">GURU RATING</div>
                <div className="mt-1 text-3xl font-semibold">{guru.guru_rating != null ? guru.guru_rating.toFixed(1) : '-'}</div>
                <div className="mt-1 text-xs opacity-80">{guru.guru_reviews_count != null ? `${guru.guru_reviews_count} reviews` : '0 reviews'}</div>
              </div>
            </div>

            {/* Rating distribution bars */}
            {guru.whop_star_counts ? (
              <div className="mt-4">
                <RatingDistribution starCounts={JSON.parse(guru.whop_star_counts)} />
              </div>
            ) : null}

            {guru.bio ? <p className="mt-4 text-[color:var(--text)]">{guru.bio}</p> : null}

            <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
              <div className="text-sm font-semibold">Before you buy</div>
              <div className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">
                Always read the refund policy on Whop before purchasing. Check recent reviews for specifics on what&apos;s included. Consider your available time and experience level.
              </div>
            </div>

            <div className="mt-4 text-sm font-semibold">Who this is for</div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">
              Beginners who want structure, intermediates who want a community, and advanced traders looking for execution feedback - you'll get the most value if you have time to show up consistently.
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Whop</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Ratings and review counts are sourced from public Whop pages. Review text stays on Whop.
            </div>
            {guru.whop_synced_at ? (
              <div className="mt-2 text-[10px] text-[color:var(--muted-2)]">
                Last synced: {new Date(guru.whop_synced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            ) : null}

            {guru.whop_url ? (
              <div className="mt-4 text-sm">
                <a className="underline-offset-4 hover:underline" href={guru.whop_url} target="_blank" rel="noreferrer">
                  View on Whop →
                </a>
              </div>
            ) : null}

            <div className="mt-6 border-t border-[color:var(--border)] pt-5">
              <div className="text-sm font-semibold">Socials</div>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                {guru.twitter_url ? (
                  <a className="underline-offset-4 hover:underline" href={guru.twitter_url} target="_blank" rel="noreferrer">X / Twitter</a>
                ) : null}
                {guru.youtube_url ? (
                  <a className="underline-offset-4 hover:underline" href={guru.youtube_url} target="_blank" rel="noreferrer">YouTube</a>
                ) : null}
                {guru.tiktok_url ? (
                  <a className="underline-offset-4 hover:underline" href={guru.tiktok_url} target="_blank" rel="noreferrer">TikTok</a>
                ) : null}
                {guru.instagram_url ? (
                  <a className="underline-offset-4 hover:underline" href={guru.instagram_url} target="_blank" rel="noreferrer">Instagram</a>
                ) : null}
                {guru.website_url ? (
                  <a className="underline-offset-4 hover:underline" href={guru.website_url} target="_blank" rel="noreferrer">Website</a>
                ) : null}
                {!guru.twitter_url && !guru.youtube_url && !guru.tiktok_url && !guru.instagram_url && !guru.website_url ? (
                  <div className="text-[color:var(--muted)]">No socials yet.</div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-2">
                {!userId ? (
                  <Link href={`/signup?next=/gurus/${guru.handle ?? ''}`}>
                    <Button className="w-full">Sign up to review</Button>
                  </Link>
                ) : (
                  <a href="#community-reviews">
                    <Button className="w-full">Write a review ↓</Button>
                  </a>
                )}
                <Link href={`/creators/${guru.handle ?? ''}`}>
                  <Button variant="ghost" className="w-full">View full creator profile</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <section>
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold">Offers</h2>
          </div>

          <div className="mt-4 grid gap-6">
            {/* Courses grouped: clipping vs everything else, with dedup */}
            {(() => {
              // Dedupe courses with same name (case-insensitive)
              const seen = new Set<string>()
              const deduped = courses.filter((c) => {
                const key = c.name.trim().toLowerCase()
                if (seen.has(key)) return false
                seen.add(key)
                return true
              })
              const clipping = deduped.filter((c) => /clip|clipping|ugc/i.test(c.name))
              const main = deduped.filter((c) => !/clip|clipping|ugc/i.test(c.name))

              const Section = ({ title, items }: { title: string; items: typeof courses }) => (
                <section>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {items.map((c) => (
                      <Card key={c.id}>
                <div className="flex items-start gap-4">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="h-20 w-32 rounded-xl border border-[color:var(--border)] object-cover"
                    />
                  ) : null}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {c.price_cents ? `$${(c.price_cents / 100).toFixed(2)}` : 'Price: n/a'}
                        </div>
                      </div>
                      {c.whop_rating != null ? (
                        <Badge className="bg-emerald-500/10 text-emerald-800 border-emerald-500/20">
                          {c.whop_rating.toFixed(1)} ★ Whop
                        </Badge>
                      ) : null}
                    </div>

                    {c.summary ? (
                      <div className="mt-2 text-sm text-[color:var(--muted)] line-clamp-3">{c.summary}</div>
                    ) : (
                      <div className="mt-2 text-sm text-[color:var(--muted-2)]">No description yet.</div>
                    )}

                    {c.whop_url ? (
                      <div className="mt-3 text-sm">
                        <a className="underline-offset-4 hover:underline" href={c.whop_url} target="_blank" rel="noreferrer">
                          View on Whop →
                        </a>
                      </div>
                    ) : null}

                    {c.whop_rating != null ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--muted-2)]">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-800">
                          {c.whop_rating.toFixed(1)} ★
                        </span>
                        {c.whop_reviews_count ? (
                          <span>{c.whop_reviews_count.toLocaleString()} reviews</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                      </Card>
                    ))}
                    {items.length === 0 ? <Card className="text-sm text-[color:var(--muted)]">No items yet.</Card> : null}
                  </div>
                </section>
              )

              return (
                <>
                  {main.length > 0 ? <Section title="Main offers" items={main} /> : null}
                  {clipping.length > 0 ? <Section title="Clipping" items={clipping} /> : null}
                  {main.length === 0 && clipping.length === 0 ? (
                    <Card className="text-sm text-[color:var(--muted)]">No offers listed yet.</Card>
                  ) : null}
                </>
              )
            })()}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[color:var(--text)]">Community Reviews</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Honest reviews from real users — the Guru Scan rating.
          </p>

          <div className="mt-4 grid gap-4">
            {userId ? (
              <GuruReviewForm guruId={guru.id} guruName={displayName} />
            ) : (
              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5 text-center">
                <div className="text-sm font-medium text-[color:var(--text)]">Want to leave a review?</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">Create a free account to share your experience.</div>
                <div className="mt-3 flex gap-2 justify-center">
                  <Link href={`/signup?next=/gurus/${guru.handle ?? ''}`}>
                    <Button>Sign up</Button>
                  </Link>
                  <Link href={`/login?next=/gurus/${guru.handle ?? ''}`}>
                    <Button variant="ghost">Log in</Button>
                  </Link>
                </div>
              </div>
            )}

            <GuruReviewList guruId={guru.id} />
          </div>
        </section>
      </div>
    </Shell>
  )
}
