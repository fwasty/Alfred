import { cn } from '@/lib/tw'

function colorFor(rating: number | null) {
  if (rating == null) return { bg: 'bg-neutral-200', fg: 'text-neutral-900', sub: 'text-neutral-700' }
  if (rating >= 4.5) return { bg: 'bg-emerald-500', fg: 'text-white', sub: 'text-white/80' }
  if (rating >= 3.5) return { bg: 'bg-lime-400', fg: 'text-neutral-900', sub: 'text-neutral-900/70' }
  if (rating >= 2.5) return { bg: 'bg-amber-400', fg: 'text-neutral-900', sub: 'text-neutral-900/70' }
  return { bg: 'bg-rose-500', fg: 'text-white', sub: 'text-white/80' }
}

export function RatingBlock({
  rating,
  label,
  count,
  className,
}: {
  rating: number | null
  label: string
  count?: number | null
  className?: string
}) {
  const c = colorFor(rating)
  const val = rating == null ? '—' : rating.toFixed(1)
  const title =
    label.toUpperCase() === 'WHOP'
      ? 'Whop rating: stars + review count sourced from public Whop pages.'
      : label.toUpperCase() === 'GURU'
        ? 'Guru Scan rating: ratings left on Guru Scan (coming soon).'
        : undefined

  return (
    <div
      title={title}
      className={cn('flex items-center gap-3 rounded-2xl px-3 py-2', c.bg, className)}
    >
      <div className={cn('grid size-10 place-items-center rounded-xl text-base font-semibold', c.fg)}>{val}</div>
      <div className={cn('leading-tight', c.fg)}>
        <div className="text-xs font-semibold tracking-wide">{label}</div>
        <div className={cn('text-xs font-medium', c.sub)}>{count != null ? `${count} reviews` : 'no data'}</div>
      </div>
    </div>
  )
}
