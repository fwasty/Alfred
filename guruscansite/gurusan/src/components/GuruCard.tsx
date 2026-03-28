import Link from 'next/link'
import { Badge } from '@/components/ui'
import type { DbGuru } from '@/lib/types'
import { RatingBlock } from '@/components/RatingBlock'
import { pickImageUrl } from '@/lib/image'

export function GuruCard({ guru }: { guru: DbGuru }) {
  const href = guru.handle ? `/gurus/${guru.handle}` : '#'

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm hover:shadow-md transition"
    >
      {/* Image header */}
      <div className="relative h-28 bg-[color:var(--surface-2)]">
        <img
          src={pickImageUrl({ primary: guru.image_url, seed: guru.handle || guru.name || 'guru' })}
          alt={guru.name}
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
            {guru.category}
          </span>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <div className="truncate text-base font-bold text-white">{guru.name}</div>
          <div className="truncate text-xs text-white/70">@{guru.handle ?? 'no-handle'}</div>
        </div>
      </div>

      {/* Ratings */}
      <div className="flex gap-2 px-3 py-3 overflow-hidden">
        <RatingBlock rating={guru.whop_rating} count={guru.whop_reviews_count} label="WHOP" className="flex-1 min-w-0" />
        <RatingBlock rating={guru.guru_rating} count={guru.guru_reviews_count} label="GURU" className="flex-1 min-w-0" />
      </div>

      {/* Bio + CTA */}
      <div className="px-3 pb-3">
        {guru.bio ? (
          <div className="text-xs text-[color:var(--muted)] line-clamp-2 leading-relaxed">{guru.bio}</div>
        ) : null}
        <div className="mt-2 text-xs font-medium text-[color:var(--accent)] group-hover:underline underline-offset-2">
          View profile →
        </div>
      </div>
    </Link>
  )
}
