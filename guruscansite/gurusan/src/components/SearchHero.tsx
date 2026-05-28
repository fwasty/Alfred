'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Item = { key: string; href: string; name: string; image_url?: string | null; sub?: string | null }

export function SearchHero({ items }: { items: Item[] }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close results on route change
  useEffect(() => {
    setFocused(false)
    setQ('')
    setResults([])
  }, [pathname])

  useMemo(() => {
    const s = q.trim()
    if (!s) { setResults([]); return }
    const ac = new AbortController()
    fetch(`/api/search?q=${encodeURIComponent(s)}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((j) => setResults((j?.data || []).slice(0, 8)))
      .catch(() => {})
    return () => ac.abort()
  }, [q])

  // Close on click outside (desktop)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function close() { setFocused(false) }
  function handleSelect() { setFocused(false); setQ(''); setResults([]) }

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
            <button onClick={() => { setQ(''); setResults([]) }} className="text-white/50 text-xs px-1">✕</button>
          )}
        </div>
      </div>

      {showResults && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="fixed inset-0 z-[100] flex flex-col sm:hidden" onClick={close}>
            <div className="flex-1 bg-black/50" />
            <div
              className="rounded-t-2xl max-h-[65vh] flex flex-col border-t border-[color:var(--border)] shadow-2xl"
              style={{ background: 'var(--page-bg, #fff)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)]">
                <span className="text-sm font-semibold text-[color:var(--text)]">Results for &ldquo;{q}&rdquo;</span>
                <button onClick={close} className="text-sm font-medium text-[color:var(--accent)] px-2 py-1">Done</button>
              </div>
              <div className="overflow-y-auto flex-1 pb-8">
                {results.map((r) => (
                  <Link key={r.key} href={r.href} onClick={handleSelect}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[color:var(--text)] active:bg-[color:var(--surface-2)] border-b border-[color:var(--border)]">
                    <img src={r.image_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(r.key)}`}
                      alt={r.name} className="size-10 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.name}</div>
                      {r.sub && <div className="truncate text-xs text-[color:var(--muted)]">{r.sub}</div>}
                    </div>
                  </Link>
                ))}
                <Link href="/list-your-course" onClick={handleSelect}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[color:var(--accent)] font-medium">
                  <span className="text-lg">+</span>
                  <span>Can't find it? Add a guru →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop: absolute dropdown */}
          <div className="hidden sm:block absolute left-0 right-0 top-full mt-2 z-50 max-h-[60vh] overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl backdrop-blur-xl">
            {results.map((r) => (
              <Link key={r.key} href={r.href} onClick={handleSelect}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-2)] transition">
                <img src={r.image_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(r.key)}`}
                  alt={r.name} className="size-8 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  {r.sub && <div className="truncate text-xs text-[color:var(--muted)]">{r.sub}</div>}
                </div>
              </Link>
            ))}
            <Link href="/list-your-course" onClick={handleSelect}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[color:var(--accent)] font-medium hover:bg-[color:var(--surface-2)] transition border-t border-[color:var(--border)]">
              <span>+</span>
              <span>Can't find it? Add a guru →</span>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
