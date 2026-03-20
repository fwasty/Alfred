'use client'

import { useEffect, useState } from 'react'

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

/** Light/Dark mode toggle button for the nav */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('gs_theme') || 'paper'
    setIsDark(saved === 'midnight')
  }, [])

  const toggle = () => {
    const next = isDark ? 'paper' : 'midnight'
    window.localStorage.setItem('gs_theme', next)
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next === 'midnight' ? 'dark' : 'light'
    setIsDark(!isDark)
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid size-9 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
