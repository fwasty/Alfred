import Link from 'next/link'
import type { CourseWithGuru } from '@/lib/courses'
import { SmartImage } from '@/components/SmartImage'

export function TopCourseCard({ c }: { c: CourseWithGuru }) {
  const displayName = c.guru_name || c.name

  const cleanSummary = c.summary
    ? c.summary.replace(/\\n/g, ' ').replace(/\s*—\s*/g, ' — ').replace(/\s{2,}/g, ' ').trim()
    : null

  return (
    <Link
      href={`/gurus/${c.guru_handle}`}
      data-card
      className="group relative w-[260px] sm:w-[300px] md:w-[340px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="relative h-40 sm:h-44">
        <SmartImage
          src={c.image_url}
          fallbackSrc={c.guru_image_url}
          seed={c.whop_url || c.guru_handle || c.name}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-white">{displayName}</div>
            <div className="truncate text-xs text-white/80">by {c.guru_name}</div>
          </div>
          <div className="shrink-0 rounded-xl bg-black/60 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-baseline gap-1.5">
              <div className="text-[10px] font-bold tracking-wider text-emerald-400">WHOP</div>
              <div className="text-sm font-bold text-white">
                {c.whop_rating != null ? c.whop_rating.toFixed(1) : '—'}
              </div>
              {c.whop_reviews_count != null ? (
                <div className="text-[10px] text-white/70">({c.whop_reviews_count.toLocaleString()})</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3">
        {cleanSummary ? (
          <div className="text-xs text-[color:var(--muted)] line-clamp-2 leading-relaxed">{cleanSummary}</div>
        ) : null}
        <div className="mt-2 text-xs font-medium text-[color:var(--accent)] group-hover:underline underline-offset-2">
          View profile →
        </div>
      </div>
    </Link>
  )
}
