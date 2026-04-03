import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { Button } from '@/components/ui'
import { SearchHero } from '@/components/SearchHero'
import { listTopClippingCoursesWeek, listTopCoursesWeek, listTrendingCourses } from '@/lib/courses'
import { listTopFreeCourses } from '@/lib/free'
import { TopCourseCard } from '@/components/TopCourseCard'
import { CourseCarousel } from '@/components/CourseCarousel'
import { HeroRotatingBackdrop } from '@/components/HeroRotatingBackdrop'
import { db } from '@/lib/sqlite'

export default async function Home() {
  const trending = listTrendingCourses(10)
  const topCourses = listTopCoursesWeek(5)
  const topFree = listTopFreeCourses(5)
  const topClipping = listTopClippingCoursesWeek(5)

  const guruCount = (db.prepare("SELECT COUNT(*) as c FROM gurus WHERE COALESCE(hidden,0)=0").get() as {c:number}).c
  const courseCount = (db.prepare("SELECT COUNT(*) as c FROM courses WHERE COALESCE(hidden,0)=0").get() as {c:number}).c

  const curatedSlides = Array.from({ length: 18 }, (_, i) => `/hero/rmp/slide_${48 + i}.jpg`)

  // Shuffle slides per hour
  const hourKey = new Date().toISOString().slice(0, 13)
  let seed = 0
  for (let i = 0; i < hourKey.length; i++) seed = (seed * 31 + hourKey.charCodeAt(i)) >>> 0
  function rand() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 }
  const shuffled = [...curatedSlides].sort(() => rand() - 0.5).slice(0, 12)

  return (
    <Shell>
      <div className="grid gap-12 sm:gap-14">

        {/* ─── HERO ─── */}
        <section className="relative -mx-4 overflow-hidden rounded-2xl border border-[color:var(--border)] sm:mx-0 sm:rounded-3xl">
          <HeroRotatingBackdrop images={shuffled} />
          <div className="relative flex min-h-[48vh] items-center justify-center sm:min-h-[56vh]">
            <div className="w-full px-5 py-8 sm:px-10 sm:py-12">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                  Find honest reviews on<br className="hidden sm:block" /> online gurus & courses.
                </h1>
                <p className="mt-3 mx-auto max-w-lg text-sm text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] sm:text-base">
                  Compare Whop ratings with real community reviews. {guruCount.toLocaleString()} gurus indexed.
                </p>
                <div className="mt-5">
                  <SearchHero items={[]} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/gurus"><Button>Browse all gurus</Button></Link>
                  <Link href="/leaderboard"><Button variant="ghost">Leaderboard</Button></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{guruCount.toLocaleString()}</div>
            <div className="mt-1 text-[11px] sm:text-xs font-medium text-emerald-600/70">Gurus indexed</div>
          </div>
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/8 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-violet-600">{courseCount.toLocaleString()}</div>
            <div className="mt-1 text-[11px] sm:text-xs font-medium text-violet-600/70">Courses tracked</div>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/8 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-sky-600">2</div>
            <div className="mt-1 text-[11px] sm:text-xs font-medium text-sky-600/70">Rating systems</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">100%</div>
            <div className="mt-1 text-[11px] sm:text-xs font-medium text-amber-600/70">Independent</div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section>
          <h2 className="text-center text-xl font-bold tracking-tight text-[color:var(--text)] sm:text-2xl">Two ratings. One honest picture.</h2>
          <p className="mt-2 mx-auto max-w-lg text-center text-sm text-[color:var(--muted)]">Every guru gets two scores — the one from Whop, and the one from you.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
              <div className="text-xl">⭐</div>
              <div className="mt-2 text-sm font-semibold text-[color:var(--text)]">Whop Rating</div>
              <div className="mt-1 text-xs text-[color:var(--muted)] leading-relaxed">Stars and review counts pulled from public Whop pages. The baseline.</div>
            </div>
            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5">
              <div className="text-xl">💬</div>
              <div className="mt-2 text-sm font-semibold text-[color:var(--text)]">Guru Rating</div>
              <div className="mt-1 text-xs text-[color:var(--muted)] leading-relaxed">Independent reviews from real users on Guru Scan. No affiliation. No filter.</div>
            </div>
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-5">
              <div className="text-xl">✅</div>
              <div className="mt-2 text-sm font-semibold text-[color:var(--text)]">Verified Profiles</div>
              <div className="mt-1 text-xs text-[color:var(--muted)] leading-relaxed">Creators can claim their profile. Verified means they're present and accountable.</div>
            </div>
          </div>
        </section>

        {/* ─── TRENDING ─── */}
        <CourseSection
          title="Trending right now"
          subtitle="High-review offers people actually buy."
          linkText="Full leaderboard →"
          linkHref="/leaderboard"
          courses={trending}
        />

        {/* ─── TOP PERFORMERS ─── */}
        <CourseSection
          title="Top performers"
          subtitle="Highest review volume across Whop."
          courses={topCourses}
        />

        {/* ─── FREE ─── */}
        <CourseSection
          title="Top free offers"
          subtitle="Free courses and communities worth joining."
          linkText="See all free →"
          linkHref="/leaderboard?tab=free"
          courses={topFree}
        />

        {/* ─── CLIPPING ─── */}
        <CourseSection
          title="Top clipping offers"
          subtitle="Clips, clipping groups, and content reward programs."
          linkText="Explore clipping →"
          linkHref="/clipping"
          courses={topClipping}
        />

        {/* ─── CTA ─── */}
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-center sm:p-10">
          <h2 className="text-xl font-bold tracking-tight text-[color:var(--text)] sm:text-2xl">Don't see your course?</h2>
          <p className="mt-2 mx-auto max-w-md text-sm text-[color:var(--muted)]">If you're a creator on Whop, get listed in seconds. We'll pull your data automatically.</p>
          <div className="mt-5">
            <Link href="/list-your-course"><Button>List your course →</Button></Link>
          </div>
        </section>

      </div>
    </Shell>
  )
}

/* Reusable course carousel section */
function CourseSection({ title, subtitle, linkText, linkHref, courses }: {
  title: string
  subtitle: string
  linkText?: string
  linkHref?: string
  courses: any[]
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[color:var(--text)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[color:var(--muted)]">{subtitle}</p>
        </div>
        {linkText && linkHref && (
          <Link className="text-xs font-medium text-[color:var(--accent)] hover:underline underline-offset-2 shrink-0" href={linkHref}>{linkText}</Link>
        )}
      </div>
      <div className="mt-3 -mx-4 border-y border-[color:var(--border)] bg-[color:var(--surface-2)] py-4 sm:mx-0 sm:rounded-2xl sm:border sm:p-4">
        <CourseCarousel innerClassName="px-4 sm:px-3">
          {courses.map((c) => <TopCourseCard key={c.id} c={c} />)}
          {!courses.length && <div className="text-sm text-[color:var(--muted)]">No courses yet.</div>}
        </CourseCarousel>
      </div>
    </section>
  )
}
