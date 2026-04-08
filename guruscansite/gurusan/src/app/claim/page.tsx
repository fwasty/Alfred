import { Shell } from '@/components/Shell'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'

export default function ClaimPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--text)]">Claim Your Profile</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Are you a guru listed on Guru Scan? Claim your profile to get a verified badge and manage your listing.
        </p>

        <Card className="mt-6">
          <div className="grid gap-4">
            <div>
              <div className="text-sm font-semibold text-[color:var(--text)]">How it works</div>
              <ol className="mt-2 list-decimal pl-5 text-sm text-[color:var(--muted)] space-y-1.5">
                <li>Send us your Whop profile URL and proof you own it (screenshot of your Whop dashboard)</li>
                <li>We verify and link your Guru Scan profile to your account</li>
                <li>You get a ✅ Verified badge on your profile</li>
                <li>You can respond to reviews and update your bio</li>
              </ol>
            </div>

            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <div className="text-sm font-semibold text-[color:var(--text)]">Benefits of verification</div>
              <ul className="mt-2 text-sm text-[color:var(--muted)] space-y-1">
                <li>✅ Verified badge on your profile</li>
                <li>💬 Ability to respond to reviews</li>
                <li>📝 Edit your bio and socials</li>
                <li>📊 Access to review analytics (coming soon)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="https://t.me/fwast" target="_blank" rel="noreferrer">
                <Button>DM on Telegram</Button>
              </a>
              <a href="https://x.com/fwasty" target="_blank" rel="noreferrer">
                <Button variant="ghost">DM on X</Button>
              </a>
            </div>

            <div className="text-xs text-[color:var(--muted-2)]">
              Verification is free. We'll respond within 24-48 hours.
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <Link href="/" className="text-sm text-[color:var(--accent)] hover:underline underline-offset-2">← Back home</Link>
        </div>
      </div>
    </Shell>
  )
}
