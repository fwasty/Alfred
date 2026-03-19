import Link from 'next/link'
import type { CourseWithGuru } from '@/lib/courses'
import { SmartImage } from '@/components/SmartImage'

export function TopCourseCard({ c }: { c: CourseWithGuru }) {
  // Use the guru/brand display name, not the raw course name (which can be lowercase or weird)
  const displayName = c.guru_name || c.name

  // Clean up summary: strip escaped newlines and excessive dashes
  const cleanSummary = c.summary
    ? c.summary.replace(/\\n/g, ' ').replace(/\s*—\s*/g, ' — ').replace(/\s{2,}/g, ' ').trim()
    : null

  return (
    <Link
      href={`/gurus/${c.guru_handle}`}
      data-card
      className="group relative w-[240px] sm:w-[300px] md:w-[340px] shrink-0 snap-start overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm hover:shadow-md transition"
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
          <div className="shrink-0 rounded-2xl bg-white/92 px-3 py-2 text-neutral-900 shadow-sm backdrop-blur">
            <div
              title="Whop rating: stars + review count sourced from public Whop pages."
              className="flex items-baseline justify-between rounded-lg bg-emerald-500/15 px-2 py-1"
            >
              <div className="text-[11px] font-semibold tracking-wide text-emerald-800">WHOP</div>
              <div className="text-right text-sm font-semibold text-emerald-900">
                {c.whop_rating != null ? c.whop_rating.toFixed(1) : '—'}
                {c.whop_reviews_count != null ? (
                  <span className="ml-1 text-[11px] font-medium text-emerald-800">({c.whop_reviews_count.toLocaleString()})</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {cleanSummary ? <div className="text-sm text-neutral-700 line-clamp-2">{cleanSummary}</div> : null}
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <div>{c.whop_reviews_count ? `${c.whop_reviews_count.toLocaleString()} reviews on Whop` : ''}</div>
          <div className="font-medium underline-offset-4 group-hover:underline text-neutral-700">View profile →</div>
        </div>
      </div>
    </Link>
  )
}
