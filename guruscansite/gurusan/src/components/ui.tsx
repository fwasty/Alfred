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
    <div
      className={`rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 backdrop-blur transition-shadow hover:shadow-[var(--card-hover-shadow)] ${className}`}
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
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
      ? 'bg-[color:var(--accent)] text-white hover:opacity-90'
      : 'bg-[color:var(--surface)] text-[color:var(--text)] hover:opacity-80 border border-[color:var(--border)]'

  return (
    <button type={type} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}
