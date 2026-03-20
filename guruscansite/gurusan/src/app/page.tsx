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

  return (
    <Shell>
      <div className="grid gap-12 sm:gap-16">

        {/* ─── HERO ─── */}
        <section className="relative -mx-4 overflow-hidden rounded-2xl sm:mx-0 sm:rounded-3xl">
          <HeroRotatingBackdrop images={curatedSlides} />
          <div className="relative flex min-h-[50vh] items-center justify-center sm:min-h-[56vh]">
            <div className="w-full px-5 py-10 sm:px-10">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                  Find honest reviews on<br />online gurus & courses.
                </h1>
                <p className="mt-3 mx-auto max-w-lg text-sm text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] sm:text-base">
                  Compare Whop ratings with real community reviews. See through the hype.
                </p>

                <div className="mt-6">
                  <SearchHero items={[]} />
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/gurus">
                    <Button>Browse all gurus</Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="ghost">Leaderboard</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-emerald-600">{guruCount.toLocaleString()}</div>
            <div className="mt-1 text-xs font-medium text-[color:var(--muted)]">Gurus indexed</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-violet-600">{courseCount.toLocaleString()}</div>
            <div className="mt-1 text-xs font-medium text-[color:var(--muted)]">Courses tracked</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-sky-600">2</div>
            <div className="mt-1 text-xs font-medium text-[color:var(--muted)]">Rating systems</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-amber-600">100%</div>
            <div className="mt-1 text-xs font-medium text-[color:var(--muted)]">Independent</div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[color:var(--text)] sm:text-3xl">Two ratings. One honest picture.</h2>
            <p className="mt-2 mx-auto max-w-lg text-sm text-[color:var(--muted)]">
              Every guru gets two scores — the one from Whop, and the one from you.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-6">
              <div className="text-2xl">⭐</div>
              <div className="mt-3 text-sm font-semibold text-[color:var(--text)]">Whop Rating</div>
              <div className="mt-1 text-sm text-[color:var(--muted)] leading-relaxed">
                Stars and review counts pulled directly from public Whop pages. The baseline.
              </div>
            </div>
            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-6">
              <div className="text-2xl">💬</div>
              <div className="mt-3 text-sm font-semibold text-[color:var(--text)]">Guru Rating</div>
              <div className="mt-1 text-sm text-[color:var(--muted)] leading-relaxed">
                Independent reviews from real users on Guru Scan. No affiliation. No filter. Coming soon.
              </div>
            </div>
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-6">
              <div className="text-2xl">✅</div>
              <div className="mt-3 text-sm font-semibold text-[color:var(--text)]">Verified Profiles</div>
              <div className="mt-1 text-sm text-[color:var(--muted)] leading-relaxed">
                Creators can claim their profile. Verified badge means they're present and accountable.
              </div>
            </div>
          </div>
        </section>

        {/* ─── TRENDING ─── */}
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[color:var(--text)]">Trending right now</h2>
              <p className="mt-1 text-xs text-[color:var(--muted)]">High-review offers people actually buy.</p>
            </div>
            <Link className="text-xs font-medium text-[color:var(--accent)] hover:underline underline-offset-2" href="/leaderboard">
              Full leaderboard →
            </Link>
          </div>
          <div className="mt-4 -mx-4 border-y border-[color:var(--border)] bg-[color:var(--surface-2)] py-4 sm:mx-0 sm:rounded-2xl sm:border sm:p-4">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {trending.map((c) => <TopCourseCard key={c.id} c={c} />)}
              {!trending.length && <div className="text-sm text-[color:var(--muted)]">No courses yet.</div>}
            </CourseCarousel>
          </div>
        </section>

        {/* ─── TOP PERFORMERS ─── */}
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[color:var(--text)]">Top performers</h2>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Highest review volume across Whop.</p>
            </div>
          </div>
          <div className="mt-4 -mx-4 border-y border-[color:var(--border)] bg-[color:var(--surface-2)] py-4 sm:mx-0 sm:rounded-2xl sm:border sm:p-4">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {topCourses.map((c) => <TopCourseCard key={c.id} c={c} />)}
              {!topCourses.length && <div className="text-sm text-[color:var(--muted)]">No courses yet.</div>}
            </CourseCarousel>
          </div>
        </section>

        {/* ─── FREE ─── */}
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[color:var(--text)]">Top free offers</h2>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Free courses and communities worth joining.</p>
            </div>
            <Link className="text-xs font-medium text-[color:var(--accent)] hover:underline underline-offset-2" href="/leaderboard?tab=free">
              See all free →
            </Link>
          </div>
          <div className="mt-4 -mx-4 border-y border-[color:var(--border)] bg-[color:var(--surface-2)] py-4 sm:mx-0 sm:rounded-2xl sm:border sm:p-4">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {topFree.map((c) => <TopCourseCard key={c.id} c={c} />)}
              {!topFree.length && <div className="text-sm text-[color:var(--muted)]">No free offers yet.</div>}
            </CourseCarousel>
          </div>
        </section>

        {/* ─── CLIPPING ─── */}
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[color:var(--text)]">Top clipping offers</h2>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Clips, clipping groups, and content reward programs.</p>
            </div>
            <Link className="text-xs font-medium text-[color:var(--accent)] hover:underline underline-offset-2" href="/clipping">
              Explore clipping →
            </Link>
          </div>
          <div className="mt-4 -mx-4 border-y border-[color:var(--border)] bg-[color:var(--surface-2)] py-4 sm:mx-0 sm:rounded-2xl sm:border sm:p-4">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {topClipping.map((c) => <TopCourseCard key={c.id} c={c} />)}
              {!topClipping.length && <div className="text-sm text-[color:var(--muted)]">No clipping offers yet.</div>}
            </CourseCarousel>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight text-[color:var(--text)] sm:text-3xl">Don't see your course?</h2>
          <p className="mt-2 mx-auto max-w-md text-sm text-[color:var(--muted)]">
            If you're a creator on Whop, add your course in seconds. We'll pull your public data and get you listed.
          </p>
          <div className="mt-6">
            <Link href="/list-your-course">
              <Button>List your course →</Button>
            </Link>
          </div>
        </section>

      </div>
    </Shell>
  )
}
