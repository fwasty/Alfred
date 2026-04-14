'use client'

import { useState } from 'react'

export function ClaimForm({ guruId, guruName }: { guruId: string; guruName: string }) {
  const [proofText, setProofText] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit() {
    setStatus('saving')
    setMessage('')
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ guruId, proofText, proofUrl }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      setStatus('done')
      setMessage(j.message || 'Claim submitted!')
    } catch (e: any) {
      setStatus('error')
      setMessage(e.message || 'Something went wrong')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
        <div className="text-lg">✅</div>
        <div className="mt-2 text-sm font-medium text-[color:var(--text)]">Claim Submitted!</div>
        <div className="mt-1 text-xs text-[color:var(--muted)]">{message}</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
      <div className="text-sm font-bold text-[color:var(--text)]">Claim "{guruName}"</div>
      <p className="mt-1 text-xs text-[color:var(--muted)]">
        Prove you own this Whop page to get a verified badge and reply to reviews.
      </p>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-[color:var(--muted)]">How can you prove ownership?</span>
          <textarea
            className="min-h-[80px] rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none resize-y"
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            placeholder="E.g., I'm the owner of this Whop page. I can verify via my Whop dashboard, social media, or by adding a code to my Whop bio."
            maxLength={1000}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-[color:var(--muted)]">Link to proof (optional)</span>
          <input
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://x.com/yourhandle or screenshot URL"
          />
        </label>

        {message && status === 'error' && (
          <div className="text-sm text-rose-500">{message}</div>
        )}

        <button
          onClick={submit}
          disabled={status === 'saving' || proofText.length < 10}
          className="rounded-xl bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? 'Submitting...' : 'Submit Claim'}
        </button>

        <div className="text-[10px] text-[color:var(--muted-2)]">
          Claims are reviewed within 24-48 hours. Verified profiles get a ✅ badge and can reply to reviews.
        </div>
      </div>
    </div>
  )
}
