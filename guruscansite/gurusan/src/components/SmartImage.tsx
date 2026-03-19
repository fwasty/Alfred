'use client'

import * as React from 'react'
import { pickImageUrl } from '@/lib/image'

export function SmartImage({
  src,
  fallbackSrc,
  seed,
  alt,
  className,
}: {
  src?: string | null
  fallbackSrc?: string | null
  seed: string
  alt: string
  className?: string
}) {
  const initial = pickImageUrl({ primary: src, fallbacks: [fallbackSrc], seed })
  const [cur, setCur] = React.useState(initial)
  const triedFallback = React.useRef(false)

  return (
    <img
      src={cur}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (triedFallback.current) {
          setCur(pickImageUrl({ primary: null, seed }))
          return
        }
        triedFallback.current = true
        setCur(pickImageUrl({ primary: fallbackSrc, seed }))
      }}
    />
  )
}
