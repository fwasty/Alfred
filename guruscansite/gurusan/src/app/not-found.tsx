import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <Shell>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[color:var(--text)] sm:text-3xl">Page not found</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)] max-w-md">
          The guru or page you're looking for doesn't exist or may have been removed.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/gurus"><Button>Browse gurus</Button></Link>
          <Link href="/"><Button variant="ghost">Go home</Button></Link>
        </div>
      </div>
    </Shell>
  )
}
