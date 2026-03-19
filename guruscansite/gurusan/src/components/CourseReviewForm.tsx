'use client'

import { useState } from 'react'

export function CourseReviewForm({ courseId }: { courseId: string }) {
  const [rating, setRating] = useState<number>(5)
  const [anonymous, setAnonymous] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [body, setBody] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setStatus('saving')
    setError(null)
    try {
      const res = await fetch('/api/reviews/course', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseId, rating, anonymous, title, body }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'Failed to save')
      setStatus('saved')
      // Refresh page to show the new review in the list
      window.location.reload()
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'Failed to save')
    }
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold">Write a review</div>
        <label className="flex items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Post anonymously
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <div className="text-xs font-medium text-neutral-700">Rating</div>
          <select
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <div className="text-xs font-medium text-neutral-700">Title (optional)</div>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short headline"
            maxLength={120}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <div className="text-xs font-medium text-neutral-700">Your review</div>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Be specific. What did you buy? What was good/bad? Who is it for?"
            maxLength={2000}
          />
          <div className="text-[11px] text-neutral-600">{body.length}/2000</div>
        </label>

        {error ? <div className="text-sm text-rose-700">{error}</div> : null}

        <button
          type="button"
          onClick={submit}
          disabled={status === 'saving' || body.trim().length < 40}
          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Submit review'}
        </button>

        <div className="text-[11px] text-neutral-600">
          Minimum length: 40 characters. One review per account per course (you can update it later).
        </div>
      </div>
    </div>
  )
}
