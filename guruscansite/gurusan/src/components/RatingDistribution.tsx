/** Rating distribution bar chart (5★ to 1★ breakdown) */
export function RatingDistribution({ starCounts }: { starCounts: number[] | null }) {
  if (!starCounts || starCounts.length < 5) return null

  // starCounts is [1★, 2★, 3★, 4★, 5★] from Whop
  const total = starCounts.reduce((a, b) => a + b, 0)
  if (total === 0) return null

  // Display 5★ first (top) down to 1★ (bottom)
  const rows = [
    { label: '5', count: starCounts[4] ?? 0 },
    { label: '4', count: starCounts[3] ?? 0 },
    { label: '3', count: starCounts[2] ?? 0 },
    { label: '2', count: starCounts[1] ?? 0 },
    { label: '1', count: starCounts[0] ?? 0 },
  ]

  const maxCount = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className="grid gap-1.5">
      <div className="text-xs font-semibold text-[color:var(--muted)]">Rating breakdown</div>
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0
        const barWidth = maxCount > 0 ? Math.max((r.count / maxCount) * 100, 2) : 2
        return (
          <div key={r.label} className="flex items-center gap-2 text-xs">
            <div className="w-4 text-right font-medium text-[color:var(--muted)]">{r.label}★</div>
            <div className="flex-1 h-4 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="w-12 text-right text-[color:var(--muted-2)]">
              {r.count > 0 ? `${pct}%` : ''}
            </div>
          </div>
        )
      })}
      <div className="mt-1 text-xs text-[color:var(--muted-2)]">{total.toLocaleString()} total reviews</div>
    </div>
  )
}
