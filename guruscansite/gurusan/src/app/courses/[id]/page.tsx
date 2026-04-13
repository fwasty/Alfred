import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { db } from '@/lib/sqlite'
import { getSessionUserId } from '@/lib/auth'
import { CourseReviewForm } from '@/components/CourseReviewForm'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId()

  const row = db
    .prepare(
      `
      SELECT
        c.*, 
        g.handle as guru_handle,
        g.name as guru_name,
        g.brand_name as brand_name,
        g.whop_url as guru_whop_url,
        g.creator_name as creator_name,
        cr.slug as creator_slug,
        cr.image_url as creator_image_url
      FROM courses c
      JOIN gurus g ON g.id = c.guru_id
      LEFT JOIN creators cr ON cr.id = g.creator_id
      WHERE c.id = ?
      LIMIT 1
    `
    )
    .get(id) as any

  if (!row) {
    return (
      <Shell>
        <div className="text-sm text-[color:var(--muted)]">Course not found.</div>
      </Shell>
    )
  }

  const title = row.name
  const brand = row.brand_name || row.guru_name
  const creatorName = row.creator_name || null

  const reviews = db
    .prepare(
      `
      SELECT
        r.id,
        r.rating,
        r.title,
        r.body,
        r.anonymous,
        r.created_at,
        u.username
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.course_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `
    )
    .all(id) as any[]

  const agg = db
    .prepare(
      `
      SELECT
        COUNT(*) as n,
        AVG(rating) as avg
      FROM reviews
      WHERE course_id = ?
    `
    )
    .get(id) as any

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8">
          <div className="text-xs text-[color:var(--muted)]">Course</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>

          <div className="mt-3 text-sm text-[color:var(--muted)]">
            Brand: <Link className="underline underline-offset-4" href={`/gurus/${row.guru_handle}`}>{brand}</Link>
          </div>

          {creatorName ? (
            <div className="mt-2 flex items-center gap-3 text-sm text-[color:var(--muted)]">
              <img
                src={row.creator_image_url || row.image_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(creatorName)}`}
                alt={creatorName}
                className="size-8 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] object-cover"
              />
              <div>
                Creator:{' '}
                {row.creator_slug ? (
                  <Link className="underline underline-offset-4" href={`/creators/${row.creator_slug}`}>{creatorName}</Link>
                ) : (
                  <span className="font-medium text-[color:var(--text)]">{creatorName}</span>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-2 text-sm text-[color:var(--muted)]">
            <div>
              Whop rating:{' '}
              <span className="font-semibold text-[color:var(--text)]">
                {row.whop_rating != null ? row.whop_rating.toFixed(2) : '—'}
              </span>{' '}
              {row.whop_reviews_count != null ? `(${row.whop_reviews_count} reviews)` : ''}
            </div>
            {row.price_cents != null ? (
              <div>
                Price: <span className="font-semibold text-[color:var(--text)]">${(row.price_cents / 100).toFixed(2)}</span>
              </div>
            ) : null}
            {row.whop_url ? (
              <div>
                Whop page:{' '}
                <a className="underline underline-offset-4" href={row.whop_url} target="_blank" rel="noreferrer">
                  Open on Whop →
                </a>
              </div>
            ) : null}
          </div>

          {row.summary ? (
            <div className="mt-6 text-sm text-[color:var(--muted)]">{row.summary}</div>
          ) : null}

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4">
              <div className="text-sm font-semibold">Guru Scan reviews</div>
              <div className="mt-1 text-sm text-[color:var(--muted)]">
                {agg?.n ? (
                  <>
                    <span className="font-semibold">{Number(agg.avg).toFixed(2)}</span> avg •{' '}
                    <span className="font-medium">{agg.n}</span> reviews
                  </>
                ) : (
                  'No reviews yet.'
                )}
              </div>
            </div>

            {userId ? (
              <CourseReviewForm courseId={id} />
            ) : (
              <div className="rounded-3xl border border-[color:var(--border)] bg-white/70 p-5">
                <div className="text-sm font-semibold">Write a review</div>
                <div className="mt-2 text-sm text-[color:var(--muted)]">
                  You’ll need a Guru Scan account to post a review (you can choose to post anonymously).
                </div>
                <div className="mt-4">
                  <Link
                    className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                    href={`/signup?next=/courses/${encodeURIComponent(id)}`}
                  >
                    Create account to review
                  </Link>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-[color:var(--border)] bg-white/70 p-5">
              <div className="text-sm font-semibold">Reviews</div>
              <div className="mt-4 grid gap-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <div className="text-sm font-semibold">
                        {r.title ? r.title : 'Review'}
                        <span className="ml-2 text-xs font-medium text-[color:var(--muted)]">
                          {r.anonymous ? 'Anonymous' : `@${r.username}`}
                        </span>
                      </div>
                      <div className="text-sm font-semibold">{Number(r.rating).toFixed(1)} / 5</div>
                    </div>
                    <div className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">{r.body}</div>
                    <div className="mt-3 text-[11px] text-[color:var(--muted)]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {!reviews.length ? <div className="text-sm text-[color:var(--muted)]">No reviews yet.</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
