'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SubmitCourseForm() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [redirect, setRedirect] = useState<string | null>(null)
  const router = useRouter()

  async function submit() {
    if (!url.trim()) return
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ whopUrl: url.trim() }),
      })
      const data = await res.json()

      if (res.status === 409 && data.redirect) {
        setStatus('error')
        setMessage(data.error)
        setRedirect(data.redirect)
        return
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to submit')

      setStatus('success')
      setMessage(data.message)
      setRedirect(data.redirect)

      // Auto-redirect after 2 seconds
      if (data.redirect) {
        setTimeout(() => router.push(data.redirect), 2000)
      }
    } catch (e: any) {
      setStatus('error')
      setMessage(e.message || 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <div className="text-3xl">🎉</div>
        <div className="mt-2 text-sm font-semibold text-[color:var(--text)]">{message}</div>
        {redirect && (
          <div className="mt-3">
            <a href={redirect} className="text-sm font-medium text-[color:var(--accent)] hover:underline">
              View profile →
            </a>
          </div>
        )}
        <div className="mt-2 text-xs text-[color:var(--muted)]">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-sm font-semibold text-[color:var(--text)]">Submit a Whop URL</div>
        <p className="mt-1 text-xs text-[color:var(--muted)]">
          Paste the Whop page URL for the guru or course you want to add.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted-2)]"
          placeholder="https://whop.com/example-guru/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button
          onClick={submit}
          disabled={status === 'loading' || !url.trim()}
          className="rounded-xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {status === 'loading' ? 'Adding...' : 'Add'}
        </button>
      </div>

      {message && status === 'error' && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-600">
          {message}
          {redirect && (
            <a href={redirect} className="ml-2 font-medium underline">View existing profile →</a>
          )}
        </div>
      )}

      <div className="text-[10px] text-[color:var(--muted-2)]">
        Submissions are instant. 5 per hour limit. Must be a valid whop.com URL.
      </div>
    </div>
  )
}
