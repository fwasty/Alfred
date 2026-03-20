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
    <div className="mt-7">
      <div className="text-xs font-medium text-neutral-700">Search creators</div>
      <div className="mt-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="text-[color:var(--muted-2)]">🔍</div>
          <input
            className="w-full bg-transparent text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted-2)]"
            placeholder="Search a creator, course, or guru…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {results.length ? (
          <div className="mt-1 overflow-hidden rounded-xl border border-black/5">
            {results.map((r) => (
              <Link
                key={r.key}
                href={r.href}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-black/5"
              >
                <img
                  src={r.image_url || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(r.key)}`}
                  alt={r.name}
                  className="size-7 rounded-lg border border-black/10 bg-white object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate">
                    <span className="font-medium">{r.name}</span>
                    {r.sub ? <span className="ml-2 text-xs text-neutral-600">{r.sub}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

