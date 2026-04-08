'use client'

import { useEffect, useState } from 'react'

export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 600)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-4 right-4 z-30 grid size-10 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] shadow-md backdrop-blur transition hover:scale-105 sm:bottom-5 sm:right-5"
      aria-label="Back to top"
    >
      <span className="text-sm">↑</span>
    </button>
  )
}
