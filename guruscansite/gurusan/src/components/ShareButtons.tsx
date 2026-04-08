'use client'

import { useState } from 'react'

export function ShareButtons({ name, handle }: { name: string; handle: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://guruscan.xyz/gurus/${handle}`
  const text = `Check out ${name} on Guru Scan`

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex gap-2">
      <a
        href={`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--text)] transition"
      >
        Share on 𝕏
      </a>
      <button
        onClick={copyLink}
        className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--text)] transition"
      >
        {copied ? '✓ Copied!' : '🔗 Copy link'}
      </button>
    </div>
  )
}
