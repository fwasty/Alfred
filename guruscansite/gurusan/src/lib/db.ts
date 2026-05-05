import { db } from './sqlite'
import { cuid, now } from './ids'
import type { DbCourse, DbCreator, DbGuru, DbUser } from '@/lib/types'

export function findUserByUsername(username: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined
}

export function findUserByUsernameOrEmail(username: string, email: string | null): DbUser | undefined {
  if (email) {
    return db
      .prepare('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1')
      .get(username, email) as DbUser | undefined
  }
  return db.prepare('SELECT * FROM users WHERE username = ? LIMIT 1').get(username) as DbUser | undefined
}

export function createUser(input: { username: string; email: string | null; password_hash: string }): DbUser {
  const ts = now()
  const id = cuid()
  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.username, input.email, input.password_hash, ts, ts)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser
  return user
}

export function listGurus(opts?: { category?: string | null }): DbGuru[] {
  // Compute an image fallback chain:
  // creator.image_url → gurus.creator_image_url → gurus.image_url → best course image
  const sql = `
    SELECT
      g.id,
      g.name,
      g.handle,
      g.category,
      g.bio,
      g.whop_url,
      COALESCE(
        CASE
          WHEN cr.image_url IS NOT NULL
            AND TRIM(cr.image_url) != ''
            AND cr.image_url NOT LIKE '%unavatar.io/instagram%'
            AND cr.image_url NOT LIKE '%whop.com/discover/%'
            AND cr.image_url NOT LIKE '%whop.com/marketplace/%'
            AND cr.image_url NOT LIKE '%whop.com/reviews/%'
            AND cr.image_url NOT LIKE '%whop.com/joined/%'
          THEN cr.image_url
        END,
        CASE
          WHEN g.creator_image_url IS NOT NULL
            AND TRIM(g.creator_image_url) != ''
            AND g.creator_image_url NOT LIKE '%unavatar.io/instagram%'
            AND g.creator_image_url NOT LIKE '%whop.com/discover/%'
            AND g.creator_image_url NOT LIKE '%whop.com/marketplace/%'
            AND g.creator_image_url NOT LIKE '%whop.com/reviews/%'
            AND g.creator_image_url NOT LIKE '%whop.com/joined/%'
          THEN g.creator_image_url
        END,
        CASE
          WHEN g.image_url IS NOT NULL
            AND TRIM(g.image_url) != ''
            AND g.image_url NOT LIKE '%unavatar.io/instagram%'
            AND g.image_url NOT LIKE '%whop.com/discover/%'
            AND g.image_url NOT LIKE '%whop.com/marketplace/%'
            AND g.image_url NOT LIKE '%whop.com/reviews/%'
            AND g.image_url NOT LIKE '%whop.com/joined/%'
          THEN g.image_url
        END,
        (
          SELECT c.image_url
          FROM courses c
          WHERE c.guru_id = g.id
            AND c.image_url IS NOT NULL
            AND TRIM(c.image_url) != ''
            AND c.image_url NOT LIKE '%unavatar.io/instagram%'
            AND c.image_url NOT LIKE '%whop.com/discover/%'
            AND c.image_url NOT LIKE '%whop.com/marketplace/%'
            AND c.image_url NOT LIKE '%whop.com/reviews/%'
            AND c.image_url NOT LIKE '%whop.com/joined/%'
          ORDER BY COALESCE(c.whop_reviews_count,0) DESC
          LIMIT 1
        )
      ) as image_url,
      g.twitter_url,
      g.youtube_url,
      g.tiktok_url,
      g.instagram_url,
      g.website_url,
      g.verified,
      g.whop_rating,
      g.whop_reviews_count,
      g.guru_rating,
      g.guru_reviews_count,
      g.created_at,
      g.updated_at,
      g.whop_star_counts,
      g.whop_route,
      g.whop_synced_at,
      g.creator_name,
      g.brand_name,
      g.creator_image_url,
      g.creator_id
    FROM gurus g
    LEFT JOIN creators cr ON cr.id = g.creator_id
    WHERE COALESCE(g.hidden,0)=0
      AND (
        ? IS NULL
        OR g.category = ?
      )
    ORDER BY COALESCE(g.whop_reviews_count,0) DESC, COALESCE(g.whop_rating,0) DESC, g.created_at DESC
    LIMIT 150
  `
  const category = opts?.category && opts.category !== 'All' ? String(opts.category) : null
  return db.prepare(sql).all(category, category) as DbGuru[]
}

export function upsertGuruAlias(guruId: string, alias: string) {
  const ts = now()
  const id = cuid()
  db.prepare(
    `INSERT OR IGNORE INTO guru_aliases (id, guru_id, alias, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(id, guruId, alias.trim(), ts)
}

export function searchGurus(query: string, limit = 8): DbGuru[] {
  const q = `%${query.toLowerCase().trim()}%`
  const sql = `
    SELECT DISTINCT g.*
    FROM gurus g
    LEFT JOIN guru_aliases a ON a.guru_id = g.id
    WHERE COALESCE(g.hidden,0)=0 AND (
          lower(g.name) LIKE ?
       OR lower(COALESCE(g.handle,'')) LIKE ?
       OR lower(COALESCE(a.alias,'')) LIKE ?
    )
    ORDER BY COALESCE(g.whop_reviews_count,0) DESC, COALESCE(g.whop_rating,0) DESC
    LIMIT ?
  `
  return db.prepare(sql).all(q, q, q, limit) as DbGuru[]
}

export function searchCreators(query: string, limit = 8): DbCreator[] {
  const q = `%${query.toLowerCase().trim()}%`
  const sql = `
    SELECT DISTINCT c.*
    FROM creators c
    LEFT JOIN creator_aliases a ON a.creator_id = c.id
    WHERE COALESCE(c.hidden,0)=0 AND (
          lower(c.name) LIKE ?
       OR lower(c.slug) LIKE ?
       OR lower(COALESCE(a.alias,'')) LIKE ?
    )
    ORDER BY c.name ASC
    LIMIT ?
  `
  return db.prepare(sql).all(q, q, q, limit) as DbCreator[]
}

export function searchCourses(query: string, limit = 8): Array<DbCourse & { guru_handle: string; guru_name: string; creator_name: string | null; creator_slug: string | null }>{
  const q = `%${query.toLowerCase().trim()}%`
  const sql = `
    SELECT
      c.*, g.handle as guru_handle, g.name as guru_name,
      cr.name as creator_name, cr.slug as creator_slug
    FROM courses c
    JOIN gurus g ON g.id = c.guru_id
    LEFT JOIN creators cr ON cr.id = g.creator_id
    LEFT JOIN course_aliases a ON a.course_id = c.id
    WHERE COALESCE(g.hidden,0)=0 AND COALESCE(c.hidden,0)=0 AND COALESCE(cr.hidden,0)=0 AND (
          lower(c.name) LIKE ?
       OR lower(COALESCE(a.alias,'')) LIKE ?
    )
    ORDER BY COALESCE(c.whop_reviews_count,0) DESC, COALESCE(c.whop_rating,0) DESC
    LIMIT ?
  `
  return db.prepare(sql).all(q, q, limit) as any
}

export function upsertCreator(input: {
  slug: string
  name: string
  bio?: string | null
  image_url?: string | null
  instagram_url?: string | null
  tiktok_url?: string | null
  youtube_url?: string | null
  twitter_url?: string | null
  website_url?: string | null
}): DbCreator {
  const ts = now()
  const existing = db.prepare('SELECT * FROM creators WHERE slug = ? LIMIT 1').get(input.slug) as DbCreator | undefined
  if (existing) {
    db.prepare(
      `UPDATE creators
       SET name = COALESCE(?, name),
           bio = COALESCE(?, bio),
           image_url = COALESCE(?, image_url),
           instagram_url = COALESCE(?, instagram_url),
           tiktok_url = COALESCE(?, tiktok_url),
           youtube_url = COALESCE(?, youtube_url),
           twitter_url = COALESCE(?, twitter_url),
           website_url = COALESCE(?, website_url),
           updated_at = ?
       WHERE id = ?`
    ).run(
      input.name,
      input.bio ?? null,
      input.image_url ?? null,
      input.instagram_url ?? null,
      input.tiktok_url ?? null,
      input.youtube_url ?? null,
      input.twitter_url ?? null,
      input.website_url ?? null,
      ts,
      existing.id
    )
    return db.prepare('SELECT * FROM creators WHERE id = ?').get(existing.id) as DbCreator
  }
  const id = cuid()
  db.prepare(
    `INSERT INTO creators (id, name, slug, bio, image_url, instagram_url, tiktok_url, youtube_url, twitter_url, website_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.slug,
    input.bio ?? null,
    input.image_url ?? null,
    input.instagram_url ?? null,
    input.tiktok_url ?? null,
    input.youtube_url ?? null,
    input.twitter_url ?? null,
    input.website_url ?? null,
    ts,
    ts
  )
  return db.prepare('SELECT * FROM creators WHERE id = ?').get(id) as DbCreator
}

export function addCreatorAlias(creatorId: string, alias: string) {
  const ts = now()
  const id = cuid()
  db.prepare(
    `INSERT OR IGNORE INTO creator_aliases (id, creator_id, alias, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(id, creatorId, alias.toLowerCase().trim(), ts)
}

export function setGuruCreator(
  guruId: string,
  creatorId: string,
  patch?: { creator_name?: string | null; creator_image_url?: string | null; brand_name?: string | null }
) {
  const ts = now()
  db.prepare(
    `UPDATE gurus
     SET creator_id = ?,
         creator_name = COALESCE(?, creator_name),
         creator_image_url = COALESCE(?, creator_image_url),
         brand_name = COALESCE(?, brand_name),
         updated_at = ?
     WHERE id = ?`
  ).run(creatorId, patch?.creator_name ?? null, patch?.creator_image_url ?? null, patch?.brand_name ?? null, ts, guruId)
}

export function getGuruByHandle(handle: string): (DbGuru & { creator_slug?: string | null; creator_display?: string | null }) | undefined {
  const sql = `
    SELECT
      g.*,
      cr.slug as creator_slug,
      cr.name as creator_display,
      COALESCE(
        CASE
          WHEN cr.image_url IS NOT NULL
            AND TRIM(cr.image_url) != ''
            AND cr.image_url NOT LIKE '%unavatar.io/instagram%'
            AND cr.image_url NOT LIKE '%whop.com/discover/%'
            AND cr.image_url NOT LIKE '%whop.com/marketplace/%'
            AND cr.image_url NOT LIKE '%whop.com/reviews/%'
            AND cr.image_url NOT LIKE '%whop.com/joined/%'
          THEN cr.image_url
        END,
        CASE
          WHEN g.creator_image_url IS NOT NULL
            AND TRIM(g.creator_image_url) != ''
            AND g.creator_image_url NOT LIKE '%unavatar.io/instagram%'
            AND g.creator_image_url NOT LIKE '%whop.com/discover/%'
            AND g.creator_image_url NOT LIKE '%whop.com/marketplace/%'
            AND g.creator_image_url NOT LIKE '%whop.com/reviews/%'
            AND g.creator_image_url NOT LIKE '%whop.com/joined/%'
          THEN g.creator_image_url
        END,
        CASE
          WHEN g.image_url IS NOT NULL
            AND TRIM(g.image_url) != ''
            AND g.image_url NOT LIKE '%unavatar.io/instagram%'
            AND g.image_url NOT LIKE '%whop.com/discover/%'
            AND g.image_url NOT LIKE '%whop.com/marketplace/%'
            AND g.image_url NOT LIKE '%whop.com/reviews/%'
            AND g.image_url NOT LIKE '%whop.com/joined/%'
          THEN g.image_url
        END,
        (
          SELECT c.image_url
          FROM courses c
          WHERE c.guru_id = g.id
            AND c.image_url IS NOT NULL
            AND TRIM(c.image_url) != ''
            AND c.image_url NOT LIKE '%unavatar.io/instagram%'
            AND c.image_url NOT LIKE '%whop.com/discover/%'
            AND c.image_url NOT LIKE '%whop.com/marketplace/%'
            AND c.image_url NOT LIKE '%whop.com/reviews/%'
            AND c.image_url NOT LIKE '%whop.com/joined/%'
          ORDER BY COALESCE(c.whop_reviews_count,0) DESC
          LIMIT 1
        )
      ) as image_url
    FROM gurus g
    LEFT JOIN creators cr ON cr.id = g.creator_id
    WHERE g.handle = ? AND COALESCE(g.hidden,0)=0
    LIMIT 1
  `
  return db.prepare(sql).get(handle) as any
}

export function listCoursesForGuru(guruId: string): DbCourse[] {
  return db
    .prepare(
      `SELECT *
       FROM courses
       WHERE guru_id = ? AND COALESCE(hidden,0)=0
       ORDER BY COALESCE(whop_reviews_count,0) DESC, COALESCE(whop_rating,0) DESC, created_at DESC`
    )
    .all(guruId) as DbCourse[]
}

export function getWhopAggregateForGuru(guruId: string): { avg_rating: number | null; total_reviews: number } {
  const row = db
    .prepare(
      `SELECT
         SUM(COALESCE(whop_reviews_count,0)) as total_reviews,
         CASE WHEN SUM(COALESCE(whop_reviews_count,0)) > 0
           THEN SUM(COALESCE(whop_reviews_count,0) * COALESCE(whop_rating,0)) * 1.0 / SUM(COALESCE(whop_reviews_count,0))
           ELSE NULL
         END as avg_rating
       FROM courses
       WHERE guru_id = ? AND whop_rating IS NOT NULL AND COALESCE(hidden,0)=0`
    )
    .get(guruId) as any

  return {
    avg_rating: row?.avg_rating != null ? Number(row.avg_rating) : null,
    total_reviews: row?.total_reviews != null ? Number(row.total_reviews) : 0,
  }
}

export function updateGuruFromWhop(handle: string, patch: {
  whop_url: string
  whop_route: string | null
  title: string | null
  bio: string | null
  image_url: string | null
  whop_rating: number | null
  whop_reviews_count: number | null
  whop_star_counts: number[] | null
  whop_synced_at: number
  instagram_url?: string | null
  tiktok_url?: string | null
  youtube_url?: string | null
  twitter_url?: string | null
  website_url?: string | null
  creator_image_url?: string | null
}) {
  const g = getGuruByHandle(handle)
  if (!g) throw new Error('Guru not found')

  const ts = now()
  db.prepare(
    `UPDATE gurus
     SET whop_url = ?, whop_route = ?,
         brand_name = COALESCE(?, brand_name),
         name = COALESCE(?, name),
         bio = COALESCE(?, bio),
         image_url = COALESCE(?, image_url),
         instagram_url = COALESCE(?, instagram_url),
         tiktok_url = COALESCE(?, tiktok_url),
         youtube_url = COALESCE(?, youtube_url),
         twitter_url = COALESCE(?, twitter_url),
         website_url = COALESCE(?, website_url),
         creator_image_url = COALESCE(?, creator_image_url),
         whop_rating = ?,
         whop_reviews_count = ?,
         whop_star_counts = ?,
         whop_synced_at = ?,
         updated_at = ?
     WHERE handle = ?`
  ).run(
    patch.whop_url,
    patch.whop_route,
    patch.title,
    patch.title,
    patch.bio,
    patch.image_url,
    patch.instagram_url ?? null,
    patch.tiktok_url ?? null,
    patch.youtube_url ?? null,
    patch.twitter_url ?? null,
    patch.website_url ?? null,
    patch.creator_image_url ?? null,
    patch.whop_rating,
    patch.whop_reviews_count,
    patch.whop_star_counts ? JSON.stringify(patch.whop_star_counts) : null,
    patch.whop_synced_at,
    ts,
    handle
  )
}

export function upsertCourseFromWhop(guruId: string, input: {
  whop_url: string | null
  name: string
  image_url: string | null
  price_cents: number | null
  whop_rating?: number | null
  whop_reviews_count?: number | null
  whop_star_counts?: number[] | null
  summary?: string | null
  whop_synced_at?: number | null
}) {
  const ts = now()

  if (input.whop_url) {
    const existing = db.prepare('SELECT * FROM courses WHERE whop_url = ? LIMIT 1').get(input.whop_url) as DbCourse | undefined
    if (existing) {
      db.prepare(
        `UPDATE courses
         SET guru_id = ?,
             name = COALESCE(?, name),
             image_url = COALESCE(?, image_url),
             price_cents = COALESCE(?, price_cents),
             whop_rating = COALESCE(?, whop_rating),
             whop_reviews_count = COALESCE(?, whop_reviews_count),
             whop_star_counts = COALESCE(?, whop_star_counts),
             summary = COALESCE(?, summary),
             whop_synced_at = COALESCE(?, whop_synced_at),
             updated_at = ?
         WHERE id = ?`
      ).run(
        guruId,
        input.name,
        input.image_url,
        input.price_cents,
        input.whop_rating ?? null,
        input.whop_reviews_count ?? null,
        input.whop_star_counts ? JSON.stringify(input.whop_star_counts) : null,
        input.summary ?? null,
        input.whop_synced_at ?? null,
        ts,
        existing.id
      )
      return
    }
  }

  const id = cuid()
  db.prepare(
    `INSERT INTO courses (
      id, guru_id, name, whop_url, image_url, price_cents,
      whop_rating, whop_reviews_count, whop_star_counts, summary, whop_synced_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    guruId,
    input.name,
    input.whop_url,
    input.image_url,
    input.price_cents,
    input.whop_rating ?? null,
    input.whop_reviews_count ?? null,
    input.whop_star_counts ? JSON.stringify(input.whop_star_counts) : null,
    input.summary ?? null,
    input.whop_synced_at ?? null,
    ts,
    ts
  )
}
