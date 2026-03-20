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
      {/* Image with rating pills */}
      <div className="relative h-40 sm:h-44">
        <SmartImage
          src={c.image_url}
          fallbackSrc={c.guru_image_url}
          seed={c.whop_url || c.guru_handle || c.name}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Rating pills - top right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-100 tracking-wide">WHOP</span>
            <span className="text-xs font-bold text-white">
              {c.whop_rating != null ? c.whop_rating.toFixed(1) : '—'}
            </span>
            {c.whop_reviews_count != null ? (
              <span className="text-[9px] text-emerald-100">({c.whop_reviews_count.toLocaleString()})</span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-violet-600/90 backdrop-blur-sm px-2.5 py-1 shadow-sm">
            <span className="text-[10px] font-bold text-violet-100 tracking-wide">GURU</span>
            <span className="text-xs font-bold text-white">—</span>
            <span className="text-[9px] text-violet-200">soon</span>
          </div>
        </div>

        {/* Name overlay - bottom */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="truncate text-base font-bold text-white drop-shadow-sm">{displayName}</div>
          <div className="truncate text-xs text-white/70">@{c.guru_handle}</div>
        </div>
      </div>

      {/* Summary + CTA */}
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
