import { Shell } from '@/components/Shell'
import { Card } from '@/components/ui'
import { getSessionUserId } from '@/lib/auth'
import { SubmitCourseForm } from '@/components/SubmitCourseForm'
import Link from 'next/link'
import { Button } from '@/components/ui'

export default async function ListYourCoursePage() {
  const userId = await getSessionUserId()

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[color:var(--text)]">Add a Guru or Course</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          Don't see a guru listed on Guru Scan? Add them in seconds by pasting their Whop URL.
          We'll pull their public data automatically.
        </p>

        <Card className="mt-6">
          {userId ? (
            <SubmitCourseForm />
          ) : (
            <div className="text-center py-4">
              <div className="text-sm font-medium text-[color:var(--text)]">Sign in to submit a guru</div>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                We require a free account to prevent spam submissions.
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <Link href="/signup?next=/list-your-course">
                  <Button>Sign up free</Button>
                </Link>
                <Link href="/login?next=/list-your-course">
                  <Button variant="ghost">Log in</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card className="mt-4">
          <div className="text-sm font-semibold text-[color:var(--text)]">How it works</div>
          <ol className="mt-3 list-decimal pl-5 text-sm text-[color:var(--muted)] space-y-2">
            <li><strong>Paste the Whop URL</strong> — the main page for the guru or course (e.g., whop.com/divine/)</li>
            <li><strong>We pull the data</strong> — name, description, ratings, and courses are scraped automatically</li>
            <li><strong>It goes live instantly</strong> — the guru appears in Browse and Search right away</li>
            <li><strong>Community reviews it</strong> — other users can now rate and review the guru</li>
          </ol>
        </Card>

        <Card className="mt-4">
          <div className="text-sm font-semibold text-[color:var(--text)]">Are you the guru?</div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            If you're listed on Guru Scan and want to manage your profile, claim it to get a verified badge and reply to reviews.
          </p>
          <div className="mt-3">
            <Link href="/claim">
              <Button variant="ghost">Claim your profile →</Button>
            </Link>
          </div>
        </Card>
      </div>
    </Shell>
  )
}
