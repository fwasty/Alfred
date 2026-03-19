import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getGuruByHandle, setGuruCreator, updateGuruFromWhop, upsertCourseFromWhop, upsertCreator, addCreatorAlias } from '@/lib/db'
import { ingestWhopCompanyFromPublicUrl } from '@/lib/whop'

const schema = z.object({
  handle: z.string().min(1),
  whopUrl: z.string().url().optional(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { handle } = parsed.data
  const g = getGuruByHandle(handle)
  if (!g) return NextResponse.json({ error: 'Guru not found' }, { status: 404 })

  const whopUrl = parsed.data.whopUrl || g.whop_url
  if (!whopUrl) return NextResponse.json({ error: 'No Whop URL set' }, { status: 400 })

  const ingest = await ingestWhopCompanyFromPublicUrl(whopUrl)

  // IMPORTANT: do NOT default to unavatar instagram images (they often return the IG logo).
  const creator_image_url = ingest.logo_url

  updateGuruFromWhop(handle, {
    whop_url: ingest.whop_url,
    whop_route: ingest.route,
    title: ingest.title,
    bio: ingest.creator_pitch,
    image_url: ingest.logo_url,
    instagram_url: ingest.socials.instagram_url,
    tiktok_url: ingest.socials.tiktok_url,
    youtube_url: ingest.socials.youtube_url,
    twitter_url: ingest.socials.twitter_url,
    website_url: ingest.socials.website_url,
    creator_image_url,
    whop_rating: ingest.reviews_average,
    whop_reviews_count: ingest.published_reviews_count,
    whop_star_counts: ingest.review_counts,
    whop_synced_at: Date.now(),
  })

  // IMPORTANT: if we don't know the real influencer yet, default to a “Whop-based creator profile”
  // so search + creator pages still work today. We can upgrade later once we discover the person.
  if (!g.creator_id) {
    // Default creator profile = Whop username/handle + Whop image.
    // Example: Ryze Network -> creator slug/handle "bonkau".
    const whopHandle = (g.handle || handle).toString().trim()
    const slug = whopHandle
    const name = ingest.title || g.brand_name || g.name || whopHandle

    const c = upsertCreator({
      slug,
      name,
      bio: ingest.creator_pitch,
      image_url: ingest.logo_url,
      instagram_url: ingest.socials.instagram_url,
      tiktok_url: ingest.socials.tiktok_url,
      youtube_url: ingest.socials.youtube_url,
      twitter_url: ingest.socials.twitter_url,
      website_url: ingest.socials.website_url,
    })

    addCreatorAlias(c.id, slug)
    addCreatorAlias(c.id, name)
    if (ingest.route) addCreatorAlias(c.id, ingest.route)
    setGuruCreator(g.id, c.id, {
      creator_name: name,
      creator_image_url: ingest.logo_url,
      brand_name: ingest.title || g.brand_name || g.name,
    })
  }

  const guruId = g.id
  if (!ingest.access_passes.length) {
    // Fallback: some Whop pages (e.g. /joined/) don't expose access passes publicly.
    // Create a single “primary offer” course so the creator profile doesn't look empty.
    upsertCourseFromWhop(guruId, {
      whop_url: ingest.whop_url,
      name: ingest.title || g.brand_name || g.name || handle,
      image_url: ingest.logo_url || g.image_url,
      price_cents: null,
      whop_rating: ingest.reviews_average,
      whop_reviews_count: ingest.published_reviews_count,
      whop_star_counts: ingest.review_counts,
      summary: ingest.creator_pitch,
      whop_synced_at: Date.now(),
    })
  } else {
    for (const ap of ingest.access_passes) {
      upsertCourseFromWhop(guruId, {
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
  }

  return NextResponse.json({ ok: true, ingest })
}
