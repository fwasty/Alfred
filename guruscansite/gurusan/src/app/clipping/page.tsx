import { Shell } from '@/components/Shell'
import { listTopClippingCoursesWeek } from '@/lib/courses'
import { TopCourseCard } from '@/components/TopCourseCard'

export default function ClippingPage() {
  const top = listTopClippingCoursesWeek(24)

  return (
    <Shell>
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Clipping</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Top clipping-style offers on Whop (ranked by rating + review volume).
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          {top.map((c) => (
            <TopCourseCard key={c.id} c={c} />
          ))}
          {!top.length ? <div className="text-sm text-neutral-600">No clipping offers found yet.</div> : null}
        </div>
      </div>
    </Shell>
  )
}
