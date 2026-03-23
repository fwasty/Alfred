'use client'

import { useEffect, useState } from 'react'

type Review = {
  id: string
  rating: number
  title: string | null
  body: string
  anonymous: number
  recommend: number | null
  tags: string | null
  username: string
  created_at: number
  updated_at: number
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export function GuruReviewList({ guruId }: { guruId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/reviews/guru?guruId=${encodeURIComponent(guruId)}`)
      .then(r => r.json())
      .then(j => setReviews(j?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [guruId])

  if (loading) return <div className="text-sm text-[color:var(--muted)]">Loading reviews…</div>

  if (!reviews.length) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-center">
        <div className="text-lg">💬</div>
        <div className="mt-2 text-sm font-medium text-[color:var(--text)]">No reviews yet</div>
        <div className="mt-1 text-xs text-[color:var(--muted)]">Be the first to share your honest experience.</div>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} />
                <span className="text-xs font-medium text-[color:var(--text)]">{r.username}</span>
                {r.recommend === 1 && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">👍 Recommends</span>
                )}
                {r.recommend === 0 && (
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-700">👎 Doesn't recommend</span>
                )}
              </div>
              {r.title && (
                <div className="mt-1 text-sm font-semibold text-[color:var(--text)]">{r.title}</div>
              )}
            </div>
            <div className="text-[10px] text-[color:var(--muted-2)] whitespace-nowrap">
              {timeAgo(r.created_at)}
            </div>
          </div>
          <div className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{r.body}</div>
          {r.tags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {r.tags.split(',').map((tag) => (
                <span key={tag} className="rounded-full bg-[color:var(--surface-2)] border border-[color:var(--border)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--muted)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
