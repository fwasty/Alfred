'use client'

import { useEffect, useMemo, useState } from 'react'

function fallbackThumb(src: string) {
  // Common YouTube thumbnail fallbacks (in decreasing quality)
  // maxresdefault often 404s; sddefault sometimes exists; hqdefault is reliably present.
  if (src.includes('/maxresdefault.webp')) return src.replace('/maxresdefault.webp', '/sddefault.webp')
  if (src.includes('/sddefault.webp')) return src.replace('/sddefault.webp', '/hqdefault.webp')
  if (src.includes('/maxresdefault.jpg')) return src.replace('/maxresdefault.jpg', '/sddefault.jpg')
  if (src.includes('/sddefault.jpg')) return src.replace('/sddefault.jpg', '/hqdefault.jpg')

  // If we got a vi_webp URL and it failed, fall back to vi jpg equivalents.
  if (src.includes('i.ytimg.com/vi_webp/') && src.includes('/hqdefault.webp')) {
    return src.replace('i.ytimg.com/vi_webp/', 'i.ytimg.com/vi/').replace('/hqdefault.webp', '/hqdefault.jpg')
  }

  return ''
}

export function HeroRotatingBackdrop({
  images,
  intervalMs = 4500,
}: {
  images: string[]
  intervalMs?: number
}) {
  const imgs = useMemo(() => images.filter(Boolean).slice(0, 12), [images])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (imgs.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % imgs.length), intervalMs)
    return () => clearInterval(t)
  }, [imgs.length, intervalMs])

  if (!imgs.length) return null

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden rounded-3xl">
      {/* rotating backdrop */}
      {imgs.map((src, i) => {
        const active = i === idx
        return (
          <div
            key={src + i}
            className={
              'absolute inset-0 transition-opacity duration-700 ' +
              (active ? 'opacity-100' : 'opacity-0')
            }
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover scale-[1.02]"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget
                const next = fallbackThumb(img.src)
                if (next) img.src = next
              }}
            />
          </div>
        )
      })}

      {/* readability overlays (about 10% darker) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/31 via-black/9 to-black/37" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.07),rgba(0,0,0,0.33))]" />
    </div>
  )
}
