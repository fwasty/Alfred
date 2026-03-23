'use client'

import { useState } from 'react'

const AVAILABLE_TAGS = [
  'Great for Beginners',
  'Advanced Strategies',
  'Active Community',
  'Good Value',
  'Overpriced',
  'Responsive',
  'Profitable',
  'Educational',
  'Transparent',
  'Hype-Heavy',
]

export function GuruReviewForm({ guruId, guruName }: { guruId: string; guruName: string }) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [anonymous, setAnonymous] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [body, setBody] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    )
  }

  async function submit() {
    if (rating === 0) { setError('Please select a rating'); return }
    if (body.trim().length < 20) { setError('Review must be at least 20 characters'); return }

    setStatus('saving')
    setError(null)
    try {
      const res = await fetch('/api/reviews/guru', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ guruId, rating, anonymous, title, body, recommend, tags: selectedTags }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'Failed to save')
      setStatus('saved')
      window.location.reload()
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'Failed to save')
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-bold text-[color:var(--text)]">Rate {guruName}</div>
        <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Anonymous
        </label>
      </div>

      <div className="mt-4 grid gap-5">
        {/* Star rating */}
        <div>
          <div className="text-xs font-medium text-[color:var(--muted)] mb-2">Your rating</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className={`text-2xl transition ${n <= displayRating ? 'text-amber-400' : 'text-[color:var(--muted-2)]'} hover:scale-110`}
              >
                ★
              </button>
            ))}
            {displayRating > 0 && (
              <span className="ml-2 text-sm font-semibold text-[color:var(--text)] self-center">{displayRating}/5</span>
            )}
          </div>
        </div>

        {/* Would recommend */}
        <div>
          <div className="text-xs font-medium text-[color:var(--muted)] mb-2">Would you recommend?</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRecommend(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                recommend === true
                  ? 'bg-emerald-600 text-white'
                  : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]'
              }`}
            >
              👍 Yes
            </button>
            <button
              type="button"
              onClick={() => setRecommend(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                recommend === false
                  ? 'bg-rose-600 text-white'
                  : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]'
              }`}
            >
              👎 No
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="text-xs font-medium text-[color:var(--muted)] mb-2">Tags (pick up to 5)</div>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  selectedTags.includes(tag)
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-[color:var(--muted)]">Title (optional)</span>
          <input
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum it up in a few words"
            maxLength={120}
          />
        </label>

        {/* Body */}
        <label className="grid gap-1">
          <span className="text-xs font-medium text-[color:var(--muted)]">Your review</span>
          <textarea
            className="min-h-[100px] rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none resize-y"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What was your experience? Was it worth the money? Who would you recommend it to?"
            maxLength={2000}
          />
          <div className="text-[10px] text-[color:var(--muted-2)]">{body.length}/2000 · min 20 chars</div>
        </label>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        <button
          type="button"
          onClick={submit}
          disabled={status === 'saving'}
          className="rounded-xl bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? 'Submitting…' : status === 'saved' ? '✓ Submitted' : 'Submit review'}
        </button>
      </div>
    </div>
  )
}
