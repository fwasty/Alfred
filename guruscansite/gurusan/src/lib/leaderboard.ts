import { db } from '@/lib/sqlite'

export type LeaderboardGuruRow = {
  guru_id: string
  guru_name: string
  guru_handle: string
  guru_whop_url: string | null
  image_url: string | null
  avg_rating: number | null
  total_reviews: number
  brand_name: string | null
}

function listTopGurusByWhere(whereSql: string, params: any[], limit = 25): LeaderboardGuruRow[] {
  const minTotalReviews = 100

  // IMPORTANT: leaderboard should not show the same creator multiple times.
  // We aggregate at the creator_id level (fallback: guru_id when creator_id is null).
  const sql = `
    WITH filtered AS (
      SELECT
        g.id as guru_id,
        COALESCE(g.creator_id, g.id) as creator_key,
        COALESCE(g.creator_name, g.name) as guru_name,
        g.handle as guru_handle,
        g.whop_url as guru_whop_url,
        COALESCE(g.brand_name, g.name) as brand_name,
        COALESCE(c.whop_reviews_count, 0) as reviews,
        c.whop_rating as rating
      FROM gurus g
      JOIN courses c ON c.guru_id = g.id
      WHERE COALESCE(g.hidden,0)=0 AND COALESCE(c.hidden,0)=0
        AND c.whop_rating IS NOT NULL
        AND COALESCE(c.whop_reviews_count, 0) > 0
        AND (${whereSql})
    ),
    guru_agg AS (
      SELECT
        creator_key,
        guru_id,
        guru_name,
        guru_handle,
        guru_whop_url,
        brand_name,
        SUM(reviews) as total_reviews,
        CASE
          WHEN SUM(reviews) > 0 THEN SUM(reviews * rating) * 1.0 / SUM(reviews)
          ELSE NULL
        END as avg_rating
      FROM filtered
      GROUP BY creator_key, guru_id, guru_name, guru_handle, guru_whop_url, brand_name
    ),
    creator_agg AS (
      SELECT
        creator_key,
        SUM(total_reviews) as total_reviews,
        CASE
          WHEN SUM(total_reviews) > 0 THEN SUM(total_reviews * avg_rating) * 1.0 / SUM(total_reviews)
          ELSE NULL
        END as avg_rating
      FROM guru_agg
      GROUP BY creator_key
      HAVING SUM(total_reviews) >= ?
    ),
    picked AS (
      SELECT
        ga.creator_key,
        ga.guru_id,
        ga.guru_name,
        ga.guru_handle,
        ga.guru_whop_url,
        ga.brand_name,
        ROW_NUMBER() OVER (
          PARTITION BY ga.creator_key
          ORDER BY ga.total_reviews DESC, COALESCE(ga.avg_rating,0) DESC, ga.guru_handle ASC
        ) as rn
      FROM guru_agg ga
    )
    SELECT
      p.guru_id,
      p.guru_name,
      p.guru_handle,
      p.guru_whop_url,
      (
        SELECT COALESCE(
          c2.image_url,
          g2.creator_image_url,
          g2.image_url,
          (
            SELECT c3.image_url
            FROM courses c3
            WHERE c3.guru_id = g2.id AND c3.image_url IS NOT NULL AND TRIM(c3.image_url) != ''
            ORDER BY COALESCE(c3.whop_reviews_count,0) DESC
            LIMIT 1
          )
        )
        FROM gurus g2
        LEFT JOIN creators c2 ON c2.id = g2.creator_id
        WHERE g2.id = p.guru_id
      ) as image_url,
      ca.avg_rating,
      ca.total_reviews,
      p.brand_name
    FROM creator_agg ca
    JOIN picked p ON p.creator_key = ca.creator_key AND p.rn = 1
    ORDER BY ca.total_reviews DESC, ca.avg_rating DESC
    LIMIT ?
  `

  return db.prepare(sql).all(...params, minTotalReviews, limit) as LeaderboardGuruRow[]
}

export function listTopGurusGeneral(limit = 25): LeaderboardGuruRow[] {
  // Exclude clipping/content rewards.
  return listTopGurusByWhere(
    'NOT (lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(g.category) = ?)',
    ['%clip%', '%clips%', '%clipping%', '%content rewards%', 'clipping'],
    limit
  )
}

export function listTopGurusGeneralByCategory(category: string, limit = 25): LeaderboardGuruRow[] {
  return listTopGurusByWhere(
    `COALESCE(c.category,'Other') = ? AND NOT (lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(g.category) = ?)`,
    [category, '%clip%', '%clips%', '%clipping%', '%content rewards%', 'clipping'],
    limit
  )
}

export function listTopGurusClipping(limit = 25): LeaderboardGuruRow[] {
  // Clipping = clip/clipping/content rewards.
  return listTopGurusByWhere(
    '(lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(g.category) = ?)',
    ['%clip%', '%clips%', '%clipping%', '%content rewards%', 'clipping'],
    limit
  )
}
