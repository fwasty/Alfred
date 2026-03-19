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
      <p className="mt-2 text-sm text-neutral-600">You’ll need an account to view full details and leave reviews.</p>

      <Card className="mt-6">
        <div className="grid gap-3">
          <a
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium hover:bg-black/5"
            href="/api/auth/google/start"
          >
            Continue with Google
          </a>

          <div className="my-1 flex items-center gap-3 text-xs text-neutral-500">
            <div className="h-px flex-1 bg-black/10" />
            OR
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-neutral-600">Username</span>
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sethtrades"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-neutral-600">Email (optional)</span>
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-neutral-600">Password</span>
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                required
              />
            </label>

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <div className="mt-2">
              <Button type="submit" className="w-full">
                {loading ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>

          <div className="text-xs text-neutral-600">
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
