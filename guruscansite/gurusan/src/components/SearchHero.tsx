'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, useEffect } from 'react'

type Item = { key: string; href: string; name: string; image_url?: string | null; sub?: string | null }

export function SearchHero({ items }: { items: Item[] }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useMemo(() => {
    const s = q.trim()
    if (!s) {
      setResults([])
      return
    }

    const ac = new AbortController()
    fetch(`/api/search?q=${encodeURIComponent(s)}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((j) => setResults((j?.data || []).slice(0, 8)))
      .catch(() => {})

    return () => ac.abort()
  }, [q])

  // Close results when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const showResults = results.length > 0 && focused

  return (
    <div ref={containerRef} className="relative mx-auto max-w-md">
      <div className="rounded-full border border-white/25 bg-black/30 backdrop-blur-md shadow-lg px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="text-white/50 text-sm">🔍</div>
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
            placeholder="Search creators, courses…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
          />
          {q && (
            <button
              onClick={() => { setQ(''); setResults([]) }}
              className="text-white/50 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results dropdown — fixed on mobile so it overlays keyboard */}
      {showResults && (
        <>
          {/* Mobile: fixed overlay */}
          <div className="fixed inset-x-0 bottom-0 top-auto z-[100] max-h-[50vh] overflow-y-auto rounded-t-2xl border-t border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl backdrop-blur-xl sm:hidden">
            <div className="sticky top-0 flex items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2">
              <span className="text-xs font-medium text-[color:var(--muted)]">Results for "{q}"</span>
              <button onClick={() => setFocused(false)} className="text-xs text-[color:var(--muted)] px-2 py-1">Done</button>
            </div>
            {results.map((r) => (
              <Link
                key={r.key}
                href={r.href}
                onClick={() => setFocused(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition border-b border-[color:var(--border)] last:border-0"
              >
                <img
                  src={r.image_url || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(r.key)}`}
                  alt={r.name}
                  className="size-10 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  {r.sub && <div className="truncate text-xs text-[color:var(--muted)]">{r.sub}</div>}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: absolute dropdown */}
          <div className="hidden sm:block absolute left-0 right-0 top-full mt-2 z-50 max-h-[60vh] overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl backdrop-blur-xl">
            {results.map((r) => (
              <Link
                key={r.key}
                href={r.href}
                onClick={() => setFocused(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition"
              >
                <img
                  src={r.image_url || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(r.key)}`}
                  alt={r.name}
                  className="size-8 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  {r.sub && <div className="truncate text-xs text-[color:var(--muted)]">{r.sub}</div>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
