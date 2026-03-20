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
      className="group relative w-[240px] sm:w-[300px] md:w-[340px] shrink-0 snap-start overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm hover:shadow-md transition"
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

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-white">{displayName}</div>
            <div className="truncate text-xs text-white/80">by {c.guru_name}</div>
          </div>

          {/* Rating badges */}
          <div className="shrink-0 flex flex-col gap-1.5">
            {/* Whop badge — green */}
            <div className="flex items-center gap-2 rounded-xl bg-emerald-600 px-2.5 py-1.5 shadow-md">
              <div className="text-lg font-bold text-white leading-none">
                {c.whop_rating != null ? c.whop_rating.toFixed(1) : '—'}
              </div>
              <div className="leading-tight">
                <div className="text-[11px] font-bold text-white tracking-wide">WHOP</div>
                <div className="text-[10px] text-emerald-100">
                  {c.whop_reviews_count != null ? `${c.whop_reviews_count.toLocaleString()} reviews` : 'no data'}
                </div>
              </div>
            </div>
            {/* Guru badge — light purple tint */}
            <div className="flex items-center gap-2 rounded-xl bg-violet-100 px-2.5 py-1.5 shadow-md">
              <div className="text-lg font-bold text-violet-400 leading-none">—</div>
              <div className="leading-tight">
                <div className="text-[11px] font-bold text-violet-800 tracking-wide">GURU</div>
                <div className="text-[10px] text-violet-500">no data</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {cleanSummary ? <div className="text-sm text-[color:var(--muted)] line-clamp-2">{cleanSummary}</div> : null}
        <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--muted-2)]">
          <div>{c.whop_reviews_count ? `${c.whop_reviews_count.toLocaleString()} reviews on Whop` : ''}</div>
          <div className="font-medium underline-offset-4 group-hover:underline text-[color:var(--text)]">View profile →</div>
        </div>
      </div>
    </Link>
  )
}
