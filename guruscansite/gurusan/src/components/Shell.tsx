import Link from 'next/link'
import { cn } from '@/lib/tw'
import { AppViewport } from '@/components/AppViewport'
import { getSessionUserId } from '@/lib/auth'
import { db } from '@/lib/sqlite'
import { AuthNav } from '@/components/AuthNav'
import { ThemeToggle } from '@/components/ThemeClient'
import { BackToTop } from '@/components/BackToTop'
// DebugHud removed

export async function Shell({
  children,
  hideFooter,
  lockScroll,
  contentClassName,
  debug,
}: {
  children: React.ReactNode
  hideFooter?: boolean
  lockScroll?: boolean
  contentClassName?: string
  debug?: boolean
}) {
  const userId = await getSessionUserId()
  const user = userId
    ? (db.prepare('SELECT id, username FROM users WHERE id = ? LIMIT 1').get(userId) as { id: string; username: string } | undefined) ?? null
    : null

  return (
    <AppViewport style={{ background: 'var(--page-bg)' }}>

      {/* debug overlay removed */}
      <div className={cn(lockScroll ? 'flex h-dvh flex-col overflow-hidden' : 'min-h-dvh')}>
        <header
          className={cn(
            'sticky top-0 z-50 backdrop-blur-xl backdrop-saturate-150',
            'bg-[color:var(--nav-bg)]'
          )}
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="mx-auto flex w-[min(1720px,calc(100vw-24px))] flex-col gap-2 px-4 py-3 sm:w-[min(1720px,calc(100vw-48px))] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-2 min-w-0">
                <div className="grid size-9 place-items-center overflow-hidden sm:size-10">
                  <img src="/brand/gs-logo-transparent.png" alt="Guru Scan" className="h-8 w-8 sm:h-9 sm:w-9" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="font-semibold whitespace-nowrap">Guru Scan</div>
                  <div className="hidden sm:block text-xs text-[color:var(--muted)]">Ratings & reviews sourced from Whop</div>
                </div>
              </Link>

              <div className="flex items-center gap-2 sm:hidden">
                <ThemeToggle />
                <AuthNav user={user} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <nav className="flex max-w-[72vw] items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-[color:var(--muted)] sm:max-w-none sm:gap-2 sm:text-sm">
                <Link
                  className="rounded-full px-2 py-1.5 transition hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] sm:px-3 sm:py-2"
                  href="/gurus"
                >
                  Browse
                </Link>
                <Link
                  className="rounded-full px-2 py-1.5 transition hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] sm:px-3 sm:py-2"
                  href="/leaderboard"
                >
                  Leaderboard
                </Link>
                <Link
                  className="rounded-full px-2 py-1.5 transition hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] sm:px-3 sm:py-2"
                  href="/about"
                >
                  About
                </Link>
                <Link
                  className="rounded-full px-2 py-1.5 transition hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] sm:px-3 sm:py-2"
                  href="/claim"
                >
                  Claim
                </Link>
              </nav>

              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <ThemeToggle />
                <AuthNav user={user} />
              </div>
            </div>
          </div>
        </header>

        <div
          className={cn(
            'mx-auto w-[min(1720px,calc(100vw-24px))] px-4 py-6 sm:w-[min(1720px,calc(100vw-48px))] sm:px-6 sm:py-10',
            lockScroll ? 'flex-1 overflow-hidden' : '',
            contentClassName
          )}
        >
          {children}
        </div>

        <BackToTop />

        {/* floating quick-action bubble */}
        <Link
          href="/list-your-course"
          aria-label="Add your course"
          className={cn(
            'fixed bottom-4 left-4 z-30',
            'grid size-14 place-items-center rounded-full border border-[color:var(--border)]',
            'sm:bottom-5 sm:left-5',
            'bg-[color:var(--surface)] shadow-md backdrop-blur transition',
            'hover:scale-[1.02] hover:opacity-90'
          )}
        >
          <img src="/brand/gs-logo-tab.png" alt="Guru Scan" className="h-8 w-8" />
        </Link>

        {hideFooter ? null : (
          <footer className="border-t border-[color:var(--border)] mt-8">
            <div className="mx-auto w-[min(1720px,calc(100vw-24px))] px-4 py-8 sm:w-[min(1720px,calc(100vw-48px))] sm:px-6 sm:py-12">
              <div className="grid gap-8 sm:grid-cols-3">
                <div>
                  <div className="flex items-center gap-2">
                    <img src="/brand/gs-logo-transparent.png" alt="Guru Scan" className="h-7 w-7" />
                    <span className="font-semibold text-[color:var(--text)]">Guru Scan</span>
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--muted)] leading-relaxed max-w-xs">
                    Independent ratings and reviews for online gurus and courses. Data sourced from public Whop pages.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[color:var(--text)] uppercase tracking-wider">Navigate</div>
                  <div className="mt-3 grid gap-1.5 text-xs text-[color:var(--muted)]">
                    <Link href="/gurus" className="hover:text-[color:var(--text)] transition">Browse Gurus</Link>
                    <Link href="/leaderboard" className="hover:text-[color:var(--text)] transition">Leaderboard</Link>
                    <Link href="/list-your-course" className="hover:text-[color:var(--text)] transition">List Your Course</Link>
                    <Link href="/about" className="hover:text-[color:var(--text)] transition">About</Link>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[color:var(--text)] uppercase tracking-wider">Legal</div>
                  <div className="mt-3 grid gap-1.5 text-xs text-[color:var(--muted)]">
                    <Link href="/privacy" className="hover:text-[color:var(--text)] transition">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-[color:var(--text)] transition">Terms of Service</Link>
                    <span>Not affiliated with Whop</span>
                    <span>© {new Date().getFullYear()} Guru Scan</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    </AppViewport>
  )
}
