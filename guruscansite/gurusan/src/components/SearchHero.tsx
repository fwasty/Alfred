'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Item = { key: string; href: string; name: string; image_url?: string | null; sub?: string | null }

export function SearchHero({ items }: { items: Item[] }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Item[]>([])

  useMemo(() => {
    const s = q.trim()
    if (!s) {
      setResults([])
      return
    }

    const ac = new AbortController()
    fetch(`/api/search?q=${encodeURIComponent(s)}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((j) => setResults((j?.data || []).slice(0, 6)))
      .catch(() => {})

    return () => ac.abort()
  }, [q])

  return (
    <div className="relative">
      <div className="rounded-xl border border-white/30 bg-white/40 backdrop-blur-md shadow-sm px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="text-white/60 text-sm">🔍</div>
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            placeholder="Search a creator, course, or guru…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {results.length ? (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-lg backdrop-blur-xl">
          {results.map((r) => (
            <Link
              key={r.key}
              href={r.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition"
            >
              <img
                src={r.image_url || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(r.key)}`}
                alt={r.name}
                className="size-8 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] object-cover"
              />
              <div className="min-w-0">
                <div className="truncate">
                  <span className="font-medium">{r.name}</span>
                  {r.sub ? <span className="ml-2 text-xs text-[color:var(--muted)]">{r.sub}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
