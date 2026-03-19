import { Shell } from '@/components/Shell'
import { SignupForm } from '@/components/SignupForm'
import { Suspense } from 'react'

export default function SignupPage() {
  return (
    <Shell>
      <Suspense fallback={<div className="text-sm text-neutral-600">Loading…</div>}>
        <SignupForm />
      </Suspense>
    </Shell>
  )
}
