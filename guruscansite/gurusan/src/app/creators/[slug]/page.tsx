import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { Badge, Card, Button } from '@/components/ui'
import { RatingBlock } from '@/components/RatingBlock'
import { db } from '@/lib/sqlite'
import { pickImageUrl } from '@/lib/image'
import type { DbCreator, DbGuru, DbCourse } from '@/lib/types'

function getCreatorBySlug(slug: string): DbCreator | undefined {
  return db.prepare('SELECT * FROM creators WHERE slug = ? AND COALESCE(hidden,0)=0 LIMIT 1').get(slug) as DbCreator | undefined
}

function getGurusForCreator(creatorId: string): DbGuru[] {
  return db.prepare(
    'SELECT * FROM gurus WHERE creator_id = ? AND COALESCE(hidden,0)=0 ORDER BY COALESCE(whop_reviews_count,0) DESC'
  ).all(creatorId) as DbGuru[]
}

function getCoursesForGuru(guruId: string): DbCourse[] {
  return db.prepare(
    'SELECT * FROM courses WHERE guru_id = ? AND COALESCE(hidden,0)=0 ORDER BY COALESCE(whop_reviews_count,0) DESC'
  ).all(guruId) as DbCourse[]
}

function getGuruByHandle(handle: string): DbGuru | undefined {
  return db.prepare('SELECT * FROM gurus WHERE handle = ? AND COALESCE(hidden,0)=0 LIMIT 1').get(handle) as DbGuru | undefined
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)
  // If no creator, try as a guru handle
  if (!creator) {
    const guru = getGuruByHandle(slug)
    if (guru) return { title: `${guru.name} — Profile` }
    return { title: 'Not Found' }
  }
  return {
    title: `${creator.name} — Creator Profile`,
    description: creator.bio || `View all courses and reviews for ${creator.name} on Guru Scan.`,
  }
}

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)

  // If no creator found, try to find a guru with this handle and show that instead
  if (!creator) {
    const guru = getGuruByHandle(slug)
    if (!guru) return notFound()

    // Show a guru-as-creator profile
    const courses = getCoursesForGuru(guru.id)
    return (
      <Shell>
        <div className="grid gap-8">
          <CreatorHeader
            name={guru.creator_name || guru.name}
            image={guru.image_url}
            bio={guru.bio}
            slug={guru.handle || slug}
            socials={{
              twitter: guru.twitter_url,
              youtube: guru.youtube_url,
              tiktok: guru.tiktok_url,
              instagram: guru.instagram_url,
              website: guru.website_url,
            }}
          />

          <BrandSection guru={guru} courses={courses} />
        </div>
      </Shell>
    )
  }

  // Full creator profile with all their brands
  const gurus = getGurusForCreator(creator.id)
  const allCourses = gurus.flatMap(g => getCoursesForGuru(g.id).map(c => ({ ...c, guruName: g.name, guruHandle: g.handle })))

  // Aggregate stats
  const totalReviews = gurus.reduce((sum, g) => sum + (g.whop_reviews_count || 0), 0)
  const avgRating = totalReviews > 0
    ? gurus.reduce((sum, g) => sum + (g.whop_rating || 0) * (g.whop_reviews_count || 0), 0) / totalReviews
    : null

  return (
    <Shell>
      <div className="grid gap-8">
        <CreatorHeader
          name={creator.name}
          image={creator.image_url}
          bio={creator.bio}
          slug={creator.slug}
          socials={{
            twitter: creator.twitter_url,
            youtube: creator.youtube_url,
            tiktok: creator.tiktok_url,
            instagram: creator.instagram_url,
            website: creator.website_url,
          }}
          stats={{ totalBrands: gurus.length, totalCourses: allCourses.length, totalReviews, avgRating }}
        />

        {gurus.map(g => (
          <BrandSection key={g.id} guru={g} courses={getCoursesForGuru(g.id)} />
        ))}

        {gurus.length === 0 && (
          <Card className="text-center py-8">
            <div className="text-sm text-[color:var(--muted)]">No brands linked to this creator yet.</div>
          </Card>
        )}
      </div>
    </Shell>
  )
}

function CreatorHeader({ name, image, bio, slug, socials, stats }: {
  name: string
  image?: string | null
  bio?: string | null
  slug: string
  socials: { twitter?: string | null; youtube?: string | null; tiktok?: string | null; instagram?: string | null; website?: string | null }
  stats?: { totalBrands: number; totalCourses: number; totalReviews: number; avgRating: number | null }
}) {
  const hasSocials = socials.twitter || socials.youtube || socials.tiktok || socials.instagram || socials.website

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
      {/* Banner area */}
      <div className="h-24 sm:h-32 bg-gradient-to-r from-violet-600/20 via-indigo-600/15 to-emerald-600/20" />

      <div className="px-4 sm:px-6 pb-5 -mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <img
            src={pickImageUrl({ primary: image, seed: slug })}
            alt={name}
            className="size-20 sm:size-24 rounded-2xl border-4 border-[color:var(--surface)] object-cover object-top shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--text)]">{name}</h1>
            <div className="text-sm text-[color:var(--muted)]">@{slug}</div>
          </div>
          <div className="flex gap-2">
            <Link href={`/gurus/${slug}`}>
              <Button variant="ghost">View on browse</Button>
            </Link>
          </div>
        </div>

        {bio && (
          <p className="mt-4 text-sm text-[color:var(--muted)] leading-relaxed max-w-2xl">{bio}</p>
        )}

        {/* Stats */}
        {stats && (
          <div className="mt-4 flex flex-wrap gap-3">
            {stats.avgRating != null && (
              <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                ⭐ {stats.avgRating.toFixed(1)} avg rating
              </div>
            )}
            <div className="rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-700">
              {stats.totalReviews.toLocaleString()} total reviews
            </div>
            <div className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-700">
              {stats.totalCourses} courses
            </div>
            {stats.totalBrands > 1 && (
              <div className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700">
                {stats.totalBrands} brands
              </div>
            )}
          </div>
        )}

        {/* Socials */}
        {hasSocials && (
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.twitter && <SocialPill href={socials.twitter} label="𝕏 Twitter" />}
            {socials.youtube && <SocialPill href={socials.youtube} label="YouTube" />}
            {socials.tiktok && <SocialPill href={socials.tiktok} label="TikTok" />}
            {socials.instagram && <SocialPill href={socials.instagram} label="Instagram" />}
            {socials.website && <SocialPill href={socials.website} label="Website" />}
          </div>
        )}
      </div>
    </div>
  )
}

function SocialPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--text)] transition"
    >
      {label}
    </a>
  )
}

function BrandSection({ guru, courses }: { guru: DbGuru; courses: DbCourse[] }) {
  // Dedupe courses by name
  const seen = new Set<string>()
  const dedupedCourses = courses.filter(c => {
    const key = c.name.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={pickImageUrl({ primary: guru.image_url, seed: guru.handle || guru.name })}
            alt={guru.name}
            className="size-10 rounded-xl border border-[color:var(--border)] object-cover object-top"
          />
          <div className="min-w-0">
            <Link href={`/gurus/${guru.handle}`} className="text-base font-bold text-[color:var(--text)] hover:underline underline-offset-2 truncate block">
              {guru.brand_name || guru.name}
            </Link>
            <div className="text-xs text-[color:var(--muted)]">{guru.category}</div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <RatingBlock rating={guru.whop_rating} count={guru.whop_reviews_count} label="WHOP" />
        </div>
      </div>

      {/* Courses grid */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {dedupedCourses.map(c => (
          <div key={c.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 flex gap-3">
            {c.image_url && (
              <img src={c.image_url} alt={c.name} className="size-16 rounded-lg object-cover shrink-0 border border-[color:var(--border)]" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[color:var(--text)] truncate">{c.name}</div>
              <div className="mt-0.5 text-xs text-[color:var(--muted)]">
                {c.price_cents ? `$${(c.price_cents / 100).toFixed(2)}` : 'Price: n/a'}
              </div>
              {c.whop_rating != null && (
                <div className="mt-1 text-xs text-emerald-600 font-medium">
                  {c.whop_rating.toFixed(1)}★ · {(c.whop_reviews_count || 0).toLocaleString()} reviews
                </div>
              )}
              {c.summary && (
                <div className="mt-1 text-[11px] text-[color:var(--muted-2)] line-clamp-2">{c.summary}</div>
              )}
            </div>
          </div>
        ))}
        {dedupedCourses.length === 0 && (
          <div className="text-sm text-[color:var(--muted)]">No courses listed yet.</div>
        )}
      </div>
    </section>
  )
}
