import { db } from '@/lib/sqlite'
import type { DbCourse } from '@/lib/types'

export type CourseWithGuru = DbCourse & {
  guru_name: string
  guru_handle: string
  guru_image_url: string | null
  guru_whop_url: string | null
}

function listTopCoursesByWhere(whereSql: string, params: any[], limit = 8, minReviews = 100): CourseWithGuru[] {
  // Professional look: prioritize volume first, then rating.
  // Also dedupe "same offer" that may appear multiple times by whop_url.

  const sql = `
    SELECT
      c.*, g.name as guru_name, g.handle as guru_handle, g.image_url as guru_image_url, g.whop_url as guru_whop_url
    FROM courses c
    JOIN gurus g ON g.id = c.guru_id
    WHERE COALESCE(g.hidden,0)=0 AND COALESCE(c.hidden,0)=0
      AND c.whop_rating IS NOT NULL
      AND COALESCE(c.whop_reviews_count, 0) >= ?
      AND (${whereSql})
    ORDER BY COALESCE(c.whop_reviews_count, 0) DESC, c.whop_rating DESC
    LIMIT ?
  `

  const rows = db.prepare(sql).all(minReviews, ...params, limit * 4) as CourseWithGuru[]

  const seenCourse = new Set<string>()
  const seenGuru = new Set<string>()
  const out: CourseWithGuru[] = []
  for (const r of rows) {
    // Dedupe exact same course (same guru + same name, case-insensitive)
    const courseKey = `${r.guru_id}:${r.name.trim().toLowerCase()}`
    if (seenCourse.has(courseKey)) continue
    seenCourse.add(courseKey)

    // Also dedupe by whop_url if present
    if (r.whop_url && seenCourse.has(r.whop_url)) continue
    if (r.whop_url) seenCourse.add(r.whop_url)

    // Only show one course per guru in homepage carousels (best one wins)
    if (seenGuru.has(r.guru_id)) continue
    seenGuru.add(r.guru_id)

    out.push(r)
    if (out.length >= limit) break
  }
  return out
}

export function listTopCoursesWeek(limit = 8): CourseWithGuru[] {
  // Top performers = highest rated courses with substantial review volume.
  // Sorted by RATING first (not review count) to differentiate from trending.
  const sql = `
    SELECT
      c.*, g.name as guru_name, g.handle as guru_handle, g.image_url as guru_image_url, g.whop_url as guru_whop_url
    FROM courses c
    JOIN gurus g ON g.id = c.guru_id
    WHERE COALESCE(g.hidden,0)=0 AND COALESCE(c.hidden,0)=0
      AND c.whop_rating IS NOT NULL
      AND c.whop_rating >= 4.5
      AND COALESCE(c.whop_reviews_count, 0) >= 200
      AND NOT (lower(c.name) LIKE '%clip%' OR lower(c.name) LIKE '%clipping%' OR lower(g.category) = 'Clipping')
      AND NOT (lower(c.name) LIKE '%free%')
    ORDER BY c.whop_rating DESC, COALESCE(c.whop_reviews_count, 0) DESC
    LIMIT ?
  `
  const rows = db.prepare(sql).all(limit * 4) as CourseWithGuru[]

  const seenGuru = new Set<string>()
  const out: CourseWithGuru[] = []
  for (const r of rows) {
    if (seenGuru.has(r.guru_id)) continue
    seenGuru.add(r.guru_id)
    out.push(r)
    if (out.length >= limit) break
  }
  return out
}

export function listTopCoursesWeekByCategory(category: string, limit = 8): CourseWithGuru[] {
  return listTopCoursesByWhere(
    `COALESCE(c.category,'Other') = ? AND NOT (lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(g.category) = ?) AND NOT (lower(c.name) LIKE ?)`,
    [category, '%clip%', '%clips%', '%clipping%', '%content rewards%', 'clipping', '%free%'],
    limit,
    100
  )
}

export function listTrendingCourses(limit = 12): CourseWithGuru[] {
  // Trending = most reviewed courses, diverse categories.
  return listTopCoursesByWhere(
    'NOT (lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(g.category) = ?) AND NOT (lower(c.name) LIKE ?)',
    ['%clip%', '%clips%', '%clipping%', '%content rewards%', 'clipping', '%free%'],
    limit,
    50
  )
}

export function listTopClippingCoursesWeek(limit = 8): CourseWithGuru[] {
  // Heuristic: clipping offers. Keep UGC (TikTok Shop etc.) separate unless it's explicitly clip/clipping.
  return listTopCoursesByWhere(
    '(lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(c.name) LIKE ? OR lower(g.category) = ?) AND NOT (lower(c.name) LIKE ?)',
    ['% clip%', '%clip%', '%clipping%', '%content rewards%', 'clipping', '%free%'],
    limit,
    50
  )
}

export function listRecentlyGrowingCourses(limit = 10): CourseWithGuru[] {
  // Find courses that gained the most reviews in the last 7 days
  // Falls back to regular trending if no snapshot data yet
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  try {
    const sql = `
      SELECT c.*, g.name as guru_name, g.handle as guru_handle, g.image_url as guru_image_url, g.whop_url as guru_whop_url,
             (COALESCE(g.whop_reviews_count, 0) - COALESCE(s.whop_reviews_count, 0)) as review_growth
      FROM gurus g
      JOIN courses c ON c.guru_id = g.id
      LEFT JOIN guru_snapshots s ON s.guru_id = g.id AND s.snapshot_date = ?
      WHERE COALESCE(g.hidden,0)=0 AND COALESCE(c.hidden,0)=0
        AND c.whop_rating IS NOT NULL
        AND COALESCE(c.whop_reviews_count, 0) >= 10
      ORDER BY review_growth DESC, COALESCE(c.whop_reviews_count, 0) DESC
      LIMIT ?
    `
    const rows = db.prepare(sql).all(weekAgo, limit * 3) as (CourseWithGuru & { review_growth: number })[]

    // Dedupe by guru
    const seen = new Set<string>()
    const out: CourseWithGuru[] = []
    for (const r of rows) {
      if (seen.has(r.guru_id)) continue
      seen.add(r.guru_id)
      out.push(r)
      if (out.length >= limit) break
    }
    return out
  } catch {
    return listTrendingCourses(limit)
  }
}
