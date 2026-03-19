import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { Badge, Button, Card } from '@/components/ui'
import { SearchHero } from '@/components/SearchHero'
import { listTopClippingCoursesWeek, listTopCoursesWeek, listTrendingCourses } from '@/lib/courses'
import { listTopFreeCourses } from '@/lib/free'
import { TopCourseCard } from '@/components/TopCourseCard'
import { CourseCarousel } from '@/components/CourseCarousel'
import { HeroRotatingBackdrop } from '@/components/HeroRotatingBackdrop'
import { fetchPlaylistVideos } from '@/lib/youtube'

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) || {}
  const hero = (Array.isArray(sp.hero) ? sp.hero[0] : sp.hero) || 'center'

  // Keep each row as a tight “bank” (about 5) so it feels curated and scrollable.
  const trending = listTrendingCourses(10)
  const topCourses = listTopCoursesWeek(5)
  const topFree = listTopFreeCourses(5)
  const topClipping = listTopClippingCoursesWeek(5)

  const whopFeaturedPlaylistId = 'PLNAr8MH2RWDjxDDDYTlFc7P5wyZwSmN9J'
  const whopVideos = await fetchPlaylistVideos(whopFeaturedPlaylistId, 12)

  // Optional: use curated local hero slides (guaranteed quality + fast)
  const curatedSlides = [
    '/hero/rmp/slide_48.jpg',
    '/hero/rmp/slide_49.jpg',
    '/hero/rmp/slide_50.jpg',
    '/hero/rmp/slide_51.jpg',
    '/hero/rmp/slide_52.jpg',
    '/hero/rmp/slide_53.jpg',
    '/hero/rmp/slide_54.jpg',
    '/hero/rmp/slide_55.jpg',
    '/hero/rmp/slide_56.jpg',
    '/hero/rmp/slide_57.jpg',
    '/hero/rmp/slide_58.jpg',
    '/hero/rmp/slide_59.jpg',
    '/hero/rmp/slide_60.jpg',
    '/hero/rmp/slide_61.jpg',
    '/hero/rmp/slide_62.jpg',
    '/hero/rmp/slide_63.jpg',
    '/hero/rmp/slide_64.jpg',
    '/hero/rmp/slide_65.jpg',
  ]

  const heroSrc = (Array.isArray(sp.heroSrc) ? sp.heroSrc[0] : sp.heroSrc) || 'curated'

  // Shuffle curated slides once per hour so it feels fresh, but stays stable enough for caching.
  const hourKey = new Date().toISOString().slice(0, 13) // YYYY-MM-DDTHH (UTC)
  const seedStr = `${hourKey}|${curatedSlides.length}`
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  function rand() {
    // xorshift32
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    return (seed >>> 0) / 4294967296
  }
  function shuffle<T>(arr: T[]) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const curatedShuffled = shuffle(curatedSlides).slice(0, 12)
  const heroImages = heroSrc === 'youtube' ? whopVideos.map((v) => v.thumb) : curatedShuffled

  return (
    <Shell>
      <div className="grid gap-10">
        {/* RMP-style hero (slideshow is the background, but actually visible) */}
        <section className="relative -mx-4 min-h-[56vh] rounded-2xl border border-black/10 shadow-[0_1px_0_rgba(0,0,0,0.04)] overflow-hidden sm:mx-0 sm:min-h-[64vh] sm:rounded-3xl">
          <HeroRotatingBackdrop images={heroImages} />

          {/* content */}
          <div className="relative flex min-h-[56vh] items-stretch sm:min-h-[64vh]">
            <div className="w-full p-5 sm:p-10">
              <div className="mx-auto max-w-4xl">
                {/* HERO VARIANTS (keep the search bubble below) */}
                {hero === 'badgepill' ? (
                  <>
                    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 backdrop-blur">
                      <Badge>Whop-wide</Badge>
                      <Badge>Ratings are public</Badge>
                      <Badge className="bg-amber-50">Defensible language</Badge>
                    </div>
                    <h1 className="mt-5 text-balance text-4xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                      Rate creators & courses.
                    </h1>
                    <p className="mt-2 max-w-2xl text-pretty text-[15px] text-white/85 drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)]">
                      Search a creator (or course) and see offers, pricing, and reviews—fast.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link href="/gurus">
                        <Button>Browse</Button>
                      </Link>
                      <Link href="/list-your-course">
                        <Button variant="ghost">Don’t see your course? Add it</Button>
                      </Link>
                    </div>
                  </>
                ) : hero === 'scrim' ? (
                  <div className="rounded-3xl border border-white/15 bg-black/18 p-5 shadow-sm backdrop-blur-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>Whop-wide</Badge>
                      <Badge>Ratings are public</Badge>
                      <Badge className="bg-amber-50">Defensible language</Badge>
                    </div>
                    <h1 className="mt-4 text-balance text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                      Rate creators & courses.
                    </h1>
                    <p className="mt-2 max-w-2xl text-pretty text-[15px] text-white/85">
                      Search a creator (or course) and see offers, pricing, and reviews—fast.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link href="/gurus">
                        <Button>Browse</Button>
                      </Link>
                      <Link href="/list-your-course">
                        <Button variant="ghost">Don’t see your course? Add it</Button>
                      </Link>
                    </div>
                  </div>
                ) : hero === 'center' ? (
                  <div className="text-center">
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <Badge>Whop-wide</Badge>
                      <Badge>Ratings are public</Badge>
                      <Badge className="bg-amber-50">Defensible language</Badge>
                    </div>
                    <h1 className="mt-5 text-balance text-4xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                      Rate creators & courses.
                    </h1>
                    <p className="mt-2 mx-auto max-w-2xl text-pretty text-[15px] text-white/85 drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)]">
                      Search a creator (or course) and see offers, pricing, and reviews—fast.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                      <Link href="/gurus">
                        <Button>Browse</Button>
                      </Link>
                      <Link href="/list-your-course">
                        <Button variant="ghost">Don’t see your course? Add it</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  // plain (default): no extra bubble; rely on drop-shadows only
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>Whop-wide</Badge>
                      <Badge>Ratings are public</Badge>
                      <Badge className="bg-amber-50">Defensible language</Badge>
                    </div>
                    <h1 className="mt-5 text-balance text-4xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]">
                      Rate creators & courses.
                    </h1>
                    <p className="mt-2 max-w-2xl text-pretty text-[15px] text-white/85 drop-shadow-[0_1px_12px_rgba(0,0,0,0.6)]">
                      Search a creator (or course) and see offers, pricing, and reviews—fast.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Link href="/gurus">
                        <Button>Browse</Button>
                      </Link>
                      <Link href="/list-your-course">
                        <Button variant="ghost">Don’t see your course? Add it</Button>
                      </Link>
                    </div>
                  </>
                )}


                {/* keep search in the hero */}
                <div className="mt-5 rounded-3xl border border-black/10 bg-white/55 p-3 shadow-sm backdrop-blur-sm sm:mt-6 sm:bg-white/75 sm:p-4 sm:backdrop-blur">
                  <SearchHero items={[]} />

                  {/* Keep hero background visible on mobile; the floating + button already exists */}
                  <div className="mt-3 text-xs text-neutral-700 sm:hidden">
                    Don’t see your course?{' '}
                    <Link className="font-medium underline-offset-4 hover:underline" href="/list-your-course">
                      Add it →
                    </Link>
                  </div>

                  <div className="mt-4 hidden rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-neutral-700 sm:block">
                    <div className="font-semibold">Don’t see your course?</div>
                    <div className="mt-1">
                      Paste your Whop link → we’ll verify it → it shows up in Browse/Search.
                      <Link className="ml-2 font-medium underline-offset-4 hover:underline" href="/list-your-course">
                        Add your course →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* scroll cue */}
                <div className="mt-4 text-xs text-[color:var(--muted)] sm:mt-6">
                  Scroll for the best courses ↓
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course rows live BELOW the hero so the slideshow reads clearly */}
        <section className="grid gap-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[color:var(--text)]">Trending right now</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">High-review offers people actually buy.</div>
            </div>
            <div className="flex items-center gap-3">
              <Link className="text-xs underline-offset-4 hover:underline text-neutral-600" href="/leaderboard">
                Full leaderboard →
              </Link>
              <Link className="text-xs underline-offset-4 hover:underline text-neutral-600" href="/list-your-course">
                Add your course
              </Link>
            </div>
          </div>

          <div className="-mx-4 overflow-hidden border-y border-black/10 bg-white/60 px-0 py-3 sm:mx-0 sm:rounded-2xl sm:border sm:p-3">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {trending.map((c) => (
                <TopCourseCard key={c.id} c={c} />
              ))}
              {!trending.length ? <div className="text-sm text-neutral-600">No courses imported yet.</div> : null}
            </CourseCarousel>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[color:var(--text)]">Top performers</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">Highest review volume (strict).</div>
            </div>
          </div>

          <div className="-mx-4 overflow-hidden border-y border-black/10 bg-white/60 px-0 py-3 sm:mx-0 sm:rounded-2xl sm:border sm:p-3">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {topCourses.map((c) => (
                <TopCourseCard key={c.id} c={c} />
              ))}
              {!topCourses.length ? <div className="text-sm text-neutral-600">No courses imported yet.</div> : null}
            </CourseCarousel>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[color:var(--text)]">Top free offers</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">Anything marked “FREE”.</div>
            </div>
            <Link className="text-xs underline-offset-4 hover:underline text-[color:var(--muted)]" href="/leaderboard?tab=free">
              Top free leaderboard →
            </Link>
          </div>

          <div className="-mx-4 overflow-hidden border-y border-black/10 bg-white/60 px-0 py-3 sm:mx-0 sm:rounded-2xl sm:border sm:p-3">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {topFree.map((c) => (
                <TopCourseCard key={c.id} c={c} />
              ))}
              {!topFree.length ? <div className="text-sm text-neutral-600">No free offers imported yet.</div> : null}
            </CourseCarousel>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[color:var(--text)]">Top clipping offers</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">Clips / clipping / content rewards.</div>
            </div>
            <Link className="text-xs underline-offset-4 hover:underline text-[color:var(--muted)]" href="/clipping">
              Explore clipping →
            </Link>
          </div>

          <div className="-mx-4 overflow-hidden border-y border-black/10 bg-white/60 px-0 py-3 sm:mx-0 sm:rounded-2xl sm:border sm:p-3">
            <CourseCarousel innerClassName="px-4 sm:px-3">
              {topClipping.map((c) => (
                <TopCourseCard key={c.id} c={c} />
              ))}
              {!topClipping.length ? <div className="text-sm text-neutral-600">No clipping offers imported yet.</div> : null}
            </CourseCarousel>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-sm font-semibold">WHOP rating</div>
            <div className="mt-1 text-sm text-neutral-700">Baseline signal from the Whop course listing (stars + count).</div>
          </Card>
          <Card>
            <div className="text-sm font-semibold">GURU rating</div>
            <div className="mt-1 text-sm text-neutral-700">Reviews left on this site (account required to post).</div>
          </Card>
          <Card>
            <div className="text-sm font-semibold">Verified badge</div>
            <div className="mt-1 text-sm text-neutral-700">Creators can claim/verify profiles (shows they’re present).</div>
          </Card>
        </section>
      </div>
    </Shell>
  )
}
