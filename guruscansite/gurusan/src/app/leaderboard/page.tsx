import { Shell } from '@/components/Shell'
import Link from 'next/link'
import { listTopClippingCoursesWeek, listTopCoursesWeek, listTopCoursesWeekByCategory } from '@/lib/courses'
import { listTopGurusGeneral, listTopGurusGeneralByCategory } from '@/lib/leaderboard'
import { listTopFreeCourses } from '@/lib/free'
import { pickImageUrl } from '@/lib/image'

function ratingColor(rating: number | null) {
  if (rating == null) return { bg: 'bg-neutral-200', fg: 'text-neutral-900' }
  if (rating >= 4.5) return { bg: 'bg-emerald-500', fg: 'text-white' }
  if (rating >= 3.5) return { bg: 'bg-lime-400', fg: 'text-neutral-900' }
  if (rating >= 2.5) return { bg: 'bg-amber-400', fg: 'text-neutral-900' }
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
    // pastel glass theme highlights
    if (n === 1)
      return 'bg-gradient-to-r from-amber-200/80 via-rose-200/60 to-sky-200/65 ring-4 ring-amber-400/60 shadow-lg'
    if (n === 2)
      return 'bg-gradient-to-r from-slate-200/85 via-cyan-200/65 to-violet-200/65 ring-4 ring-slate-400/70 shadow-lg'
    if (n === 3)
      return 'bg-gradient-to-r from-orange-200/75 via-pink-200/55 to-indigo-200/60 ring-4 ring-orange-400/55 shadow-lg'
    return null
  })()

  const rowClass = podiumClass ? `${podiumClass} border-l-4 ${n === 1 ? 'border-l-amber-400/80' : n === 2 ? 'border-l-slate-400/80' : 'border-l-orange-400/80'}` : 'hover:bg-black/5'

  const subClass = top3 ? 'text-neutral-700' : 'text-neutral-600'
  const nClass = top3 ? 'text-neutral-700' : 'text-neutral-600'

  return (
    <Link
      href={href}
      className={`grid grid-cols-[40px_36px_1fr_96px] items-center gap-3 rounded-xl px-3 py-2 backdrop-blur sm:grid-cols-[48px_44px_1fr_130px] sm:gap-4 ${rowClass}`}
    >
      <div className="flex items-center gap-1">
        <div className={`text-xs font-semibold w-6 ${nClass}`}>{n}</div>
        <div
          className={`grid size-6 place-items-center rounded-full border border-black/10 bg-white/70 text-sm ${top3 ? 'shadow-sm' : ''}`}
          aria-hidden
        >
          {medal}
        </div>
      </div>

      <img
        src={pickImageUrl({ primary: imageUrl, seed: imageSeed || name })}
        alt=""
        className="size-9 rounded-xl border border-black/10 bg-white object-cover sm:size-11"
        loading="lazy"
      />

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className={`truncate text-xs ${subClass}`}>{sub}</div>
      </div>

      <div className="justify-self-end text-right">
        <div className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-semibold ${rc.bg} ${rc.fg}`}>
          {whopRating != null ? whopRating.toFixed(2) : '—'}
        </div>
        <div className="mt-1 text-[11px] text-neutral-600">
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
          <h1 className="text-4xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Best of the best. First: top creators (gurus). Then: top courses. Split into General vs Clipping.
          </p>
        </div>

        <section className="grid gap-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold">Gurus — Top 25</h2>
            <div className="text-xs text-neutral-700">Overall (combined)</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 p-2">
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
            {!topGurusGeneral.length ? <div className="p-4 text-sm text-neutral-600">No gurus yet.</div> : null}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold">Courses — General (Top 25)</h2>
            <div className="text-xs text-neutral-700">Excludes clips/clipping/content rewards</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 p-2">
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
            {!topCoursesGeneral.length ? <div className="p-4 text-sm text-neutral-600">No courses yet.</div> : null}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold">Courses — Clipping (Top 25)</h2>
            <div className="text-xs text-neutral-700">Clips/clipping/content rewards</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 p-2">
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
            {!topCoursesClipping.length ? <div className="p-4 text-sm text-neutral-600">No clipping offers yet.</div> : null}
          </div>
        </section>
      </div>
    </Shell>
  )
}
