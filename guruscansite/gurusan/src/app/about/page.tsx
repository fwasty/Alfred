import Link from 'next/link'
import { Shell } from '@/components/Shell'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  return (
    <Shell>
      <div className="grid gap-10">
        <header className="grid gap-3">
          <div className="text-xs font-semibold tracking-wide text-[color:var(--muted)]">ABOUT</div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[color:var(--text)]">Why Guru Scan exists</h1>
          <p className="max-w-3xl text-sm text-[color:var(--muted)]">
            The internet is full of “gurus”. Some are legit. Most are noise. Guru Scan is being built to make the market
            for creator products more transparent: one profile per creator, every offer in one place, and ratings that are
            easy to compare.
          </p>
        </header>

        <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <h2 className="text-xl font-semibold">Who I am</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Built by Seth — a futures trader and creator. I wanted a clean way to quickly see what’s actually popular,
            what has real reviews behind it, and who’s behind each brand.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-medium hover:bg-white"
              href="https://x.com/fwasty"
              target="_blank"
              rel="noreferrer"
            >
              X / @fwasty
            </a>
            <a
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-medium hover:bg-white"
              href="https://www.instagram.com/sethlum/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram / @sethlum
            </a>
            <a
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-medium hover:bg-white"
              href="https://www.tiktok.com/@sethlumx"
              target="_blank"
              rel="noreferrer"
            >
              TikTok / @sethlumx
            </a>
            <a
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-medium hover:bg-white"
              href="https://www.youtube.com/@sethlum"
              target="_blank"
              rel="noreferrer"
            >
              YouTube / @sethlum
            </a>
          </div>

          <p className="mt-4 text-xs text-[color:var(--muted-2)]">
            If any of these links are wrong, tell me and I’ll update them.
          </p>
        </section>

        <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Where the data comes from</h2>
            <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2">
              <div className="text-[11px] font-semibold tracking-wide text-[color:var(--muted)]">SOURCED FROM</div>
              <img src="/brand/whop-w-transparent.png" alt="Whop" className="h-6 w-auto opacity-95" />
            </div>
          </div>

          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Ratings and review counts shown on Guru Scan are sourced from public pages on <strong>Whop</strong>. We’re not
            affiliated with Whop. We link out to the original Whop pages for details and purchase.
          </p>
          <p className="mt-3 text-xs text-[color:var(--muted-2)]">
            Note: some offers/brands may be hidden until they have a confirmed Whop page + usable images.
          </p>
        </section>

        <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <h2 className="text-xl font-semibold">What’s next</h2>
          <ul className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
            <li>• Claimable creator profiles + verification badges</li>
            <li>• Cleaner categories + filters (trading first, expand from there)</li>
            <li>• Better images (no placeholders) and full offer lists per creator</li>
            <li>• A leaderboard that rewards real reviews, not hype</li>
          </ul>
        </section>

        <div className="text-sm">
          <Link className="underline underline-offset-4 text-[color:var(--text)]" href="/">
            ← Back home
          </Link>
        </div>
      </div>
    </Shell>
  )
}
