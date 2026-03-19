'use client'

import { useEffect, useState } from 'react'

export function DebugHud() {
  const [s, setS] = useState({
    scrollX: 0,
    scrollY: 0,
    innerW: 0,
    innerH: 0,
    docScrollLeft: 0,
    viewportLeft: 0,
  })

  useEffect(() => {
    const tick = () => {
      const se = document.scrollingElement as HTMLElement | null
      setS({
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        docScrollLeft: se?.scrollLeft || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
        viewportLeft: window.visualViewport?.offsetLeft || 0,
      })
    }
    tick()
    const id = window.setInterval(tick, 250)
    window.addEventListener('scroll', tick, { passive: true })
    window.visualViewport?.addEventListener('scroll', tick, { passive: true } as any)
    window.addEventListener('resize', tick)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
      window.visualViewport?.removeEventListener('scroll', tick as any)
    }
  }, [])

  return (
    <div className="fixed bottom-3 right-3 z-[1000] rounded-xl border border-black/15 bg-white/90 px-3 py-2 text-[11px] text-neutral-800 shadow-sm">
      <div className="font-semibold">DEBUG</div>
      <div>scrollX: {s.scrollX}</div>
      <div>docScrollLeft: {s.docScrollLeft}</div>
      <div>visualViewport.left: {s.viewportLeft}</div>
      <div>inner: {s.innerW}×{s.innerH}</div>
    </div>
  )
}
