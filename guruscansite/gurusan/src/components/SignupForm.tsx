'use client'

import { Button, Card } from '@/components/ui'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function SignupForm() {
  const router = useRouter()
  const sp = useSearchParams()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const next = sp.get('next') || '/gurus'

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.error || 'Signup failed')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-4xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-[color:var(--muted)]">You’ll need an account to view full details and leave reviews.</p>

      <Card className="mt-6">
        <div className="grid gap-3">
          <a
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-sm font-medium hover:opacity-90 transition"
            href="/api/auth/google/start"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9s0 .002 0 0a8.997 8.997 0 00.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          <div className="my-1 flex items-center gap-3 text-xs text-[color:var(--muted-2)]">
            <div className="h-px flex-1 bg-[color:var(--border)]" />
            OR
            <div className="h-px flex-1 bg-[color:var(--border)]" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-[color:var(--muted)]">Username</span>
              <input
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-sm outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sethtrades"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-[color:var(--muted)]">Email (optional)</span>
              <input
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-sm outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-[color:var(--muted)]">Password</span>
              <input
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-sm outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                required
              />
            </label>

            {error ? <div className="text-sm text-rose-500">{error}</div> : null}

            <div className="mt-2">
              <Button type="submit" className="w-full">
                {loading ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>

          <div className="text-xs text-[color:var(--muted)]">
            Already have an account?{' '}
            <Link className="underline underline-offset-4" href="/login">
              Log in
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
