'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

export function AuthNav({
  user,
}: {
  user: { id: string; username: string } | null
}) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.refresh()
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
            Log in
          </Button>
        </Link>
        <Link href="/signup">
          <Button className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">Sign up</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block text-sm text-[color:var(--muted)]">@{user.username}</div>
      <button
        onClick={logout}
        className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-black/5 sm:px-4 sm:py-2 sm:text-sm"
        type="button"
      >
        Log out
      </button>
    </div>
  )
}
