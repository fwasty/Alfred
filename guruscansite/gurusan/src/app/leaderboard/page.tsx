import { Shell } from '@/components/Shell'
import Link from 'next/link'
import { listTopClippingCoursesWeek, listTopCoursesWeek, listTopCoursesWeekByCategory } from '@/lib/courses'
import { listTopGurusGeneral, listTopGurusGeneralByCategory } from '@/lib/leaderboard'
import { listTopFreeCourses } from '@/lib/free'
import { pickImageUrl } from '@/lib/image'

function ratingColor(rating: number | null) {
  if (rating == null) return { bg: 'bg-neutral-500/20', fg: 'text-[color:var(--muted)]' }
  if (rating >= 4.5) return { bg: 'bg-emerald-500', fg: 'text-white' }
  if (rating >= 3.5) return { bg: 'bg-lime-500', fg: 'text-white' }
  if (rating >= 2.5) return { bg: 'bg-amber-500', fg: 'text-white' }
  return { bg: 'bg-rose-500', fg: 'text-white' }
}

function medalFor(n: number) {
  if (n === 1) return '🥇'
  if (n === 2) return '🥈'
  if (n === 3) return '🥉'
  return null
}

function Row({
  n,
  name,
  sub,
  whopRating,
  whopReviews,
  href,
  imageUrl,
  imageSeed,
}: {
  n: number
  name: string
  sub: string
  whopRating: number | null
  whopReviews: number | null
  href: string
  imageUrl?: string | null
  imageSeed?: string
}) {
  const medal = medalFor(n)
  const rc = ratingColor(whopRating)
  const top3 = n <= 3

  const podiumClass = (() => {
    if (n === 1)
      return 'bg-amber-500/10 ring-1 ring-amber-500/30 shadow-sm'
    if (n === 2)
      return 'bg-slate-500/8 ring-1 ring-slate-400/25 shadow-sm'
    if (n === 3)
      return 'bg-orange-500/8 ring-1 ring-orange-400/20 shadow-sm'
    return null
  })()

  const rowClass = podiumClass || 'hover:bg-[color:var(--surface-2)]'

  return (
    <Link
      href={href}
      className={`grid grid-cols-[36px_32px_1fr_80px] items-center gap-2 rounded-xl px-2 py-2.5 transition sm:grid-cols-[48px_44px_1fr_130px] sm:gap-4 sm:px-3 ${rowClass}`}
    >
      <div className="flex items-center gap-1">
        <div className="text-xs font-semibold w-6 text-[color:var(--muted)]">{n}</div>
        <div
          className={`grid size-6 place-items-center rounded-full text-sm ${top3 ? '' : ''}`}
          aria-hidden
        >
          {medal}
        </div>
      </div>

      <img
        src={pickImageUrl({ primary: imageUrl, seed: imageSeed || name })}
        alt=""
        className="size-9 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] object-cover object-top sm:size-11"
        loading="lazy"
      />

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[color:var(--text)]">{name}</div>
        <div className="truncate text-xs text-[color:var(--muted)]">{sub}</div>
      </div>

      <div className="justify-self-end text-right">
        <div className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-semibold ${rc.bg} ${rc.fg}`}>
          {whopRating != null ? whopRating.toFixed(2) : '—'}
        </div>
        <div className="mt-1 text-[11px] text-[color:var(--muted-2)]">
          {whopReviews != null ? `${whopReviews.toLocaleString()} reviews` : 'no data'}
        </div>
      </div>
    </Link>
  )
}

const CATEGORIES = [
  'Overall',
  'Futures',
  'Options',
  'Forex',
  'Crypto',
  'Stocks',
  'Sports Betting',
  'Ecom / Reselling',
  'AI / Automation',
  'Agency / Marketing',
  'Creator / TikTok Shop',
  'Fitness / Wellness',
  'Other',
] as const

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (searchParams ? await searchParams : {}) as any
  const tab = typeof sp?.tab === 'string' ? sp.tab : null
  const catRaw = typeof sp?.cat === 'string' ? sp.cat : null
  const cat = catRaw && CATEGORIES.includes(catRaw as any) ? catRaw : 'Overall'

  const topGurusGeneral = cat === 'Overall' ? listTopGurusGeneral(25) : listTopGurusGeneralByCategory(cat, 25)
  const topCoursesGeneral = cat === 'Overall' ? listTopCoursesWeek(25) : listTopCoursesWeekByCategory(cat, 25)
  const topFreeCourses = listTopFreeCourses(25)
  const topCoursesClipping = listTopClippingCoursesWeek(25)

  return (
    <Shell>
      <div className="grid gap-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--text)]">Leaderboard</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Best of the best. Top creators, courses, and clipping offers ranked by reviews.
          </p>
        </div>

        <section className="grid gap-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--text)]">🏆 Gurus — Top 25</h2>
            <div className="text-xs text-[color:var(--muted)]">Overall (combined)</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
            {topGurusGeneral.map((g, i) => (
              <Row
                key={g.guru_id}
                n={i + 1}
                name={g.guru_name}
                sub={g.brand_name && g.brand_name.toLowerCase() !== g.guru_name.toLowerCase() ? g.brand_name : `@${g.guru_handle}`}
                whopRating={g.avg_rating}
                whopReviews={g.total_reviews}
                href={`/gurus/${g.guru_handle}`}
                imageUrl={g.image_url}
                imageSeed={g.guru_handle}
              />
            ))}
            {!topGurusGeneral.length ? <div className="p-4 text-sm text-[color:var(--muted)]">No gurus yet.</div> : null}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--text)]">📚 Courses — General (Top 25)</h2>
            <div className="text-xs text-[color:var(--muted)]">Excludes clips/clipping/content rewards</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
            {topCoursesGeneral.map((c, i) => (
              <Row
                key={c.id}
                n={i + 1}
                name={c.name}
                sub={c.guru_name}
                whopRating={c.whop_rating}
                whopReviews={c.whop_reviews_count}
                href={`/gurus/${c.guru_handle}`}
                imageUrl={c.image_url || c.guru_image_url}
                imageSeed={c.guru_handle}
              />
            ))}
            {!topCoursesGeneral.length ? <div className="p-4 text-sm text-[color:var(--muted)]">No courses yet.</div> : null}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--text)]">✂️ Courses — Clipping (Top 25)</h2>
            <div className="text-xs text-[color:var(--muted)]">Clips/clipping/content rewards</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
            {topCoursesClipping.map((c, i) => (
              <Row
                key={c.id}
                n={i + 1}
                name={c.name}
                sub={c.guru_name}
                whopRating={c.whop_rating}
                whopReviews={c.whop_reviews_count}
                href={`/gurus/${c.guru_handle}`}
                imageUrl={c.image_url || c.guru_image_url}
                imageSeed={c.guru_handle}
              />
            ))}
            {!topCoursesClipping.length ? <div className="p-4 text-sm text-[color:var(--muted)]">No clipping offers yet.</div> : null}
          </div>
        </section>
      </div>
    </Shell>
  )
}
