export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs font-medium text-[color:var(--muted)] ${className}`}
    >
      {children}
    </span>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/10 bg-white/70 p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  type,
}: {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'ghost'
  type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition'
  const styles =
    variant === 'primary'
      ? 'bg-black text-white hover:bg-black/90'
      : 'bg-white/70 text-neutral-900 hover:bg-black/5 border border-black/10'

  return (
    <button type={type} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}
