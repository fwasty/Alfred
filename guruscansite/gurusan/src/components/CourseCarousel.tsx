'use client'

import { useMemo, useRef } from 'react'
import { cn } from '@/lib/tw'

export function CourseCarousel({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  const scrollByCards = (dir: -1 | 1) => {
    const el = ref.current
    if (!el) return
    const first = el.querySelector<HTMLElement>('[data-card]')
    const step = first ? first.offsetWidth + 16 : Math.round(el.clientWidth * 0.9)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  // Convert wheel/trackpad scroll into horizontal scroll INSIDE the row.
  // This prevents the page from drifting horizontally and makes the carousel feel like your example.
  const onWheel = (e: React.WheelEvent) => {
    const el = ref.current
    if (!el) return

    const hasOverflow = el.scrollWidth > el.clientWidth + 4
    if (!hasOverflow) return

    // If the user scrolls vertically OR horizontally on a trackpad, move the row.
    const dx = e.deltaX
    const dy = e.deltaY
    const amt = Math.abs(dy) > Math.abs(dx) ? dy : dx

    el.scrollLeft += amt
    e.preventDefault()
  }

  const hasOverflow = useMemo(() => true, [])

  return (
    <div className={cn('relative', className)}>
      {/* edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 z-[5] h-full w-6 bg-gradient-to-r from-[color:var(--surface)] to-transparent sm:w-10" />
      <div className="pointer-events-none absolute right-0 top-0 z-[5] h-full w-6 bg-gradient-to-l from-[color:var(--surface)] to-transparent sm:w-10" />

      {/* scroll buttons */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByCards(-1)}
        className={cn(
          'hidden sm:block absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] shadow-sm backdrop-blur hover:bg-white',
          hasOverflow ? '' : 'hidden'
        )}
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByCards(1)}
        className={cn(
          'hidden sm:block absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] shadow-sm backdrop-blur hover:bg-white',
          hasOverflow ? '' : 'hidden'
        )}
      >
        →
      </button>

      <div
        ref={ref}
        onWheel={onWheel}
        className={cn(
          'flex w-full gap-4 overflow-x-scroll overflow-y-hidden pb-3 overscroll-x-contain scroll-smooth snap-x snap-proximity touch-pan-x',
          innerClassName
        )}
        style={{ WebkitOverflowScrolling: 'touch', cursor: 'grab', touchAction: 'pan-x' }}
        onPointerDown={(e) => {
          const el = ref.current
          if (!el) return

          // If the user is trying to click a link/button inside a card, don't hijack it.
          const target = e.target as HTMLElement | null
          if (target?.closest('a,button,input,select,textarea')) return

          // drag-to-scroll for mouse AND touch
          el.setPointerCapture?.(e.pointerId)
          const startX = e.clientX
          const startLeft = el.scrollLeft
          let moved = false

          const move = (ev: PointerEvent) => {
            // Only treat as drag after a small threshold, so taps still click cards.
            if (!moved && Math.abs(ev.clientX - startX) < 6) return
            moved = true
            el.scrollLeft = startLeft - (ev.clientX - startX)
          }
          const up = (ev: PointerEvent) => {
            try {
              el.releasePointerCapture?.(ev.pointerId)
            } catch {}
            el.removeEventListener('pointermove', move)
            el.removeEventListener('pointerup', up)
            el.removeEventListener('pointercancel', up)
            if (moved) {
              const sel = window.getSelection?.()
              sel?.removeAllRanges?.()
            }
          }

          el.addEventListener('pointermove', move)
          el.addEventListener('pointerup', up)
          el.addEventListener('pointercancel', up)
        }}
      >
        {children}
      </div>
    </div>
  )
}
