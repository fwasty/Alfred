import { cn } from '@/lib/tw'

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
  const isWhop = label.toUpperCase() === 'WHOP'
  const isGuru = label.toUpperCase() === 'GURU'
  const val = rating == null ? '—' : rating.toFixed(1)

  const title = isWhop
    ? 'Whop rating: stars + review count sourced from public Whop pages.'
    : isGuru
      ? 'Guru Scan rating: ratings left on Guru Scan (coming soon).'
      : undefined

  // Whop = solid green, Guru = light purple tint
  const bg = isWhop
    ? (rating != null && rating >= 4.5 ? 'bg-emerald-600' : rating != null ? 'bg-emerald-500' : 'bg-emerald-500/80')
    : 'bg-violet-100'

  const scoreFg = isWhop ? 'text-white' : 'text-violet-400'
  const labelFg = isWhop ? 'text-white' : 'text-violet-800'
  const subFg = isWhop ? 'text-emerald-100' : 'text-violet-500'

  return (
    <div
      title={title}
      className={cn('flex items-center gap-2 rounded-xl px-2 py-1.5 shadow-sm overflow-hidden', bg, className)}
    >
      <div className={cn('text-lg font-bold leading-none shrink-0', scoreFg)}>{val}</div>
      <div className="leading-tight min-w-0">
        <div className={cn('text-[11px] font-bold tracking-wide', labelFg)}>{label}</div>
        <div className={cn('text-[10px] truncate', subFg)}>
          {count != null && count > 0 ? `${count.toLocaleString()} reviews` : 'no data'}
        </div>
      </div>
    </div>
  )
}
