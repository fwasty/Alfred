import { Shell } from '@/components/Shell'
import { Card } from '@/components/ui'
import { RatingBlock } from '@/components/RatingBlock'
import { db } from '@/lib/sqlite'
import { pickImageUrl } from '@/lib/image'
import Link from 'next/link'
import type { DbGuru } from '@/lib/types'

function getGuru(handle: string): (DbGuru & { course_count: number }) | null {
  const g = db.prepare('SELECT * FROM gurus WHERE handle = ? AND COALESCE(hidden,0)=0 LIMIT 1').get(handle) as DbGuru | undefined
  if (!g) return null
  const cc = db.prepare('SELECT COUNT(*) as c FROM courses WHERE guru_id = ? AND COALESCE(hidden,0)=0').get(g.id) as { c: number }
  return { ...g, course_count: cc.c }
}

function GuruColumn({ guru }: { guru: (DbGuru & { course_count: number }) }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-center">
        <img
          src={pickImageUrl({ primary: guru.image_url, seed: guru.handle || guru.name })}
          alt={guru.name}
          className="mx-auto size-16 sm:size-20 rounded-2xl border border-[color:var(--border)] object-cover object-top"
        />
        <Link href={`/gurus/${guru.handle}`} className="mt-2 block text-sm font-bold text-[color:var(--text)] hover:underline truncate">{guru.name}</Link>
        <div className="text-xs text-[color:var(--muted)]">{guru.category}</div>
      </div>

      <div className="mt-4 grid gap-2">
        <RatingBlock rating={guru.whop_rating} count={guru.whop_reviews_count} label="WHOP" />
        <RatingBlock rating={guru.guru_rating} count={guru.guru_reviews_count} label="GURU" />
      </div>

      <div className="mt-4 grid gap-2 text-xs">
        <div className="flex justify-between"><span className="text-[color:var(--muted)]">Courses</span><span className="font-medium text-[color:var(--text)]">{guru.course_count}</span></div>
        <div className="flex justify-between"><span className="text-[color:var(--muted)]">Verified</span><span className="font-medium text-[color:var(--text)]">{guru.verified ? '✅ Yes' : 'No'}</span></div>
        <div className="flex justify-between"><span className="text-[color:var(--muted)]">Category</span><span className="font-medium text-[color:var(--text)]">{guru.category}</span></div>
      </div>

      {guru.bio && <div className="mt-3 text-xs text-[color:var(--muted)] line-clamp-3">{guru.bio}</div>}
    </div>
  )
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (searchParams ? await searchParams : {}) as any
  const a = typeof sp?.a === 'string' ? sp.a : null
  const b = typeof sp?.b === 'string' ? sp.b : null

  const guruA = a ? getGuru(a) : null
  const guruB = b ? getGuru(b) : null

  // Get top gurus for selection
  const topGurus = db.prepare("SELECT name, handle FROM gurus WHERE COALESCE(hidden,0)=0 AND whop_reviews_count > 50 ORDER BY whop_reviews_count DESC LIMIT 30").all() as { name: string; handle: string }[]

  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--text)]">Compare Gurus</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">See two gurus side by side.</p>

        <Card className="mt-6">
          <form className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-[color:var(--muted)]">Guru A</span>
              <select name="a" defaultValue={a || ''} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text)] outline-none">
                <option value="">Select a guru...</option>
                {topGurus.map(g => <option key={g.handle} value={g.handle}>{g.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-[color:var(--muted)]">Guru B</span>
              <select name="b" defaultValue={b || ''} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text)] outline-none">
                <option value="">Select a guru...</option>
                {topGurus.map(g => <option key={g.handle} value={g.handle}>{g.name}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-[color:var(--accent)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90">Compare</button>
            </div>
          </form>
        </Card>

        {guruA && guruB && (
          <div className="mt-6 flex gap-4 sm:gap-6">
            <GuruColumn guru={guruA} />
            <div className="w-px bg-[color:var(--border)] shrink-0" />
            <GuruColumn guru={guruB} />
          </div>
        )}

        {(guruA && !guruB) || (!guruA && guruB) ? (
          <div className="mt-6 text-center text-sm text-[color:var(--muted)]">Select two gurus to compare.</div>
        ) : null}
      </div>
    </Shell>
  )
}
