'use client'

import { useEffect } from 'react'

const THEMES = new Set(['paper', 'midnight', 'mono', 'glass', 'editorial'])

type Theme = 'paper' | 'midnight' | 'mono' | 'glass' | 'editorial'

export function ThemeClient() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const qp = (url.searchParams.get('theme') || '').toLowerCase()

    const saved = window.localStorage.getItem('gs_theme') || ''

    const pick = (t: string): Theme | null => (THEMES.has(t) ? (t as Theme) : null)

    const theme = pick(qp) || pick(saved) || ('paper' as Theme)

    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme === 'midnight' ? 'dark' : 'light'

    // persist if explicitly chosen
    if (pick(qp)) window.localStorage.setItem('gs_theme', theme)
  }, [])

  return null
}
