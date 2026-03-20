'use client'

import { useState } from 'react'

const CATEGORIES = [
  'All',
  'Trading',
  'Ecom',
  'Sports Betting',
  'Clipping',
  'AI',
  'Agency',
  'Marketing',
  'Business',
  'Creator',
  'Crypto',
]

export function CategoryFilter({
  onChange,
  initial = 'All',
}: {
  onChange: (cat: string) => void
  initial?: string
}) {
  const [active, setActive] = useState(initial)

  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => {
            setActive(cat)
            onChange(cat)
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            active === cat
              ? 'bg-[color:var(--accent)] text-white'
              : 'bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
