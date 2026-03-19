'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/tw'

export function AppViewport({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const clamp = () => {
      if (el.scrollLeft !== 0) el.scrollLeft = 0
    }

    clamp()

    // Some webviews/trackpads try to pan containers horizontally.
    el.addEventListener('scroll', clamp, { passive: true })

    return () => {
      el.removeEventListener('scroll', clamp)
    }
  }, [])

  return (
    <div
      ref={ref}
      style={style}
      className={cn('w-full min-h-dvh overflow-x-hidden', className)}
    >
      {children}
    </div>
  )
}
