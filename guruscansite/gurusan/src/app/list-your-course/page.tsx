import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { Card, Button } from '@/components/ui'

export default function ListYourCoursePage() {
  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Don’t see your course listed?</h1>
        <p className="mt-3 text-neutral-700">
          Listings are free. We pull public Whop signals (rating + count + product tiles) and link back to Whop for full reviews.
        </p>

        <Card className="mt-6">
          <div className="text-sm font-semibold">How to get listed</div>
          <ol className="mt-3 list-decimal pl-5 text-sm text-neutral-700 space-y-2">
            <li>Send the Whop URL (your main store/community page).</li>
            <li>We ingest the public data and your listing appears in the directory.</li>
            <li>To leave reviews or claim/verify, create an account.</li>
          </ol>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex"
              href="https://t.me/fwast"
              target="_blank"
              rel="noreferrer"
            >
              <Button>DM the Whop link</Button>
            </a>
            <Link href="/">
              <Button variant="ghost">Back home</Button>
            </Link>
          </div>

          <div className="mt-6 text-xs text-neutral-500">
            Monetization idea (later): verified/claimed profiles + featured placements clearly labeled (not pay-to-rank).
          </div>
        </Card>
      </div>
    </Shell>
  )
}
