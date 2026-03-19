import { Shell } from '@/components/Shell'
import { LoginForm } from '@/components/LoginForm'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Shell>
      <Suspense fallback={<div className="text-sm text-neutral-600">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </Shell>
  )
}
