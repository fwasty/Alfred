import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { Badge, Card } from '@/components/ui'
import { listGurus } from '@/lib/db'
import { CATEGORIES } from '@/lib/categories'
import { GuruCard } from '@/components/GuruCard'
import { db } from '@/lib/sqlite'

export default async function GurusPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (searchParams ? await searchParams : {}) as any
  const catRaw = typeof sp?.cat === 'string' ? sp.cat : 'All'
  const cat = (CATEGORIES as readonly string[]).includes(catRaw) ? catRaw : 'All'

  const gurus = listGurus({ category: cat === 'All' ? null : cat })

  // Get counts per category for pills
  const catCounts = Object.fromEntries(
    (db.prepare("SELECT category, COUNT(*) as c FROM gurus WHERE COALESCE(hidden,0)=0 GROUP BY category").all() as {category:string,c:number}[])
      .map(r => [r.category, r.c])
  )
  const totalCount = Object.values(catCounts).reduce((a, b) => a + b, 0)

  const catDescriptions: Record<string, string> = {
    'All': `Browse all ${totalCount} gurus across every category. Sorted by review count.`,
    'Trading': 'Day trading, swing trading, futures, options, and stock market education.',
    'Crypto': 'Cryptocurrency trading signals, DeFi education, and crypto market analysis.',
    'Ecom': 'E-commerce, dropshipping, Amazon FBA, reselling, and online selling.',
    'Sports Betting': 'Sports picks, betting analysis, and wagering strategies.',
    'Clipping': 'Content clipping, video editing, and creator monetization programs.',
    'AI': 'AI automation, tools, chatbots, and artificial intelligence education.',
    'Agency': 'SMMA, agency building, client acquisition, and service businesses.',
    'Marketing': 'Digital marketing, SEO, ads, funnels, and growth strategies.',
    'Business': 'Entrepreneurship, side hustles, and money-making education.',
    'Creator': 'Content creation, social media growth, TikTok Shop, and creator economy.',
    'Real Estate': 'Real estate investing, wholesaling, and property strategies.',
    'Tools': 'Software tools, templates, and digital resources.',
    'Other': 'Various online courses and communities.',
  }

  const totalGurus = (db.prepare("SELECT COUNT(*) as c FROM gurus WHERE COALESCE(hidden,0)=0").get() as {c:number}).c

  return (
    <Shell>
      <div className="grid gap-8">

        {/* Header */}
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-8 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text)] sm:text-3xl md:text-4xl">Browse Gurus</h1>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {catDescriptions[cat] || catDescriptions['All']}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">{gurus.length} results</span>
            </div>
          </div>

          {/* Category filter */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={c === 'All' ? '/gurus' : `/gurus?cat=${encodeURIComponent(c)}`}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${
                  c === cat
                    ? 'bg-[color:var(--accent)] text-white shadow-sm'
                    : 'border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-[color:var(--text)]'
                }`}
              >
                {c} <span className="opacity-60">({c === 'All' ? totalCount : (catCounts[c] || 0)})</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gurus.map((g) => (
            <GuruCard key={g.id} guru={g} />
          ))}

          {gurus.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3 text-sm text-[color:var(--muted)] text-center py-12">
              No gurus found in this category.
            </Card>
          ) : null}
        </div>

      </div>
    </Shell>
  )
}
