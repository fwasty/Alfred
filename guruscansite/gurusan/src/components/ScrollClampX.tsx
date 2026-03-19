'use client'

import { useEffect } from 'react'

export function ScrollClampX() {
  useEffect(() => {
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    } catch {}

    const clamp = () => {
      const y = window.scrollY
      const se = document.scrollingElement as HTMLElement | null

      // Force all known scroll containers back to 0.
      if (window.scrollX !== 0) window.scrollTo(0, y)
      if (se && se.scrollLeft) se.scrollLeft = 0
      if (document.documentElement.scrollLeft) document.documentElement.scrollLeft = 0
      if (document.body.scrollLeft) document.body.scrollLeft = 0

      // VisualViewport can offset on some browsers; re-clamp on its scroll events.
      try {
        // no-op read to ensure it exists
        void window.visualViewport?.offsetLeft
      } catch {}
    }

    clamp()

    // Webviews sometimes apply horizontal drift after multiple paints.
    // Use RAF for ~3 seconds (180 frames) then stop.
    let frames = 0
    let raf = 0
    const tick = () => {
      clamp()
      frames++
      if (frames < 180) raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    window.addEventListener('scroll', clamp, { passive: true })
    window.addEventListener('resize', clamp)
    window.visualViewport?.addEventListener('scroll', clamp, { passive: true } as any)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', clamp)
      window.removeEventListener('resize', clamp)
      window.visualViewport?.removeEventListener('scroll', clamp as any)
    }
  }, [])

  return null
}
