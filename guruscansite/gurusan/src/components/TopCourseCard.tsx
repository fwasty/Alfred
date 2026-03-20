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
      {/* Image */}
      <div className="relative h-36 sm:h-40">
        <SmartImage
          src={c.image_url}
          fallbackSrc={c.guru_image_url}
          seed={c.whop_url || c.guru_handle || c.name}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Name overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="truncate text-base font-bold text-white drop-shadow-sm">{displayName}</div>
          <div className="truncate text-xs text-white/75">@{c.guru_handle}</div>
        </div>
      </div>

      {/* Ratings row */}
      <div className="flex items-stretch border-b border-[color:var(--border)]">
        <div className="flex-1 px-3 py-2.5 border-r border-[color:var(--border)]">
          <div className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">Whop</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg font-bold text-[color:var(--text)]">
              {c.whop_rating != null ? c.whop_rating.toFixed(1) : '—'}
            </span>
            <span className="text-[10px] text-[color:var(--muted-2)]">
              {c.whop_reviews_count != null ? `(${c.whop_reviews_count.toLocaleString()})` : ''}
            </span>
          </div>
        </div>
        <div className="flex-1 px-3 py-2.5">
          <div className="text-[10px] font-bold tracking-wider text-violet-600 uppercase">Guru</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg font-bold text-[color:var(--text)]">—</span>
            <span className="text-[10px] text-violet-500 font-medium">coming soon</span>
          </div>
        </div>
      </div>

      {/* Summary */}
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
