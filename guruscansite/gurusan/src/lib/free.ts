import { db } from '@/lib/sqlite'
import type { CourseWithGuru } from '@/lib/courses'

export function listTopFreeCourses(limit = 8): CourseWithGuru[] {
  const sql = `
    SELECT
      c.*, g.name as guru_name, g.handle as guru_handle, g.image_url as guru_image_url, g.whop_url as guru_whop_url
    FROM courses c
    JOIN gurus g ON g.id = c.guru_id
    WHERE COALESCE(g.hidden,0)=0 AND COALESCE(c.hidden,0)=0
      AND c.whop_rating IS NOT NULL
      AND lower(c.name) LIKE '%free%'
    ORDER BY COALESCE(c.whop_reviews_count,0) DESC, c.whop_rating DESC
    LIMIT ?
  `

  const rows = db.prepare(sql).all(limit * 4) as CourseWithGuru[]
  const seenCourse = new Set<string>()
  const seenGuru = new Set<string>()
  const out: CourseWithGuru[] = []
  for (const r of rows) {
    const courseKey = `${r.guru_id}:${r.name.trim().toLowerCase()}`
    if (seenCourse.has(courseKey)) continue
    seenCourse.add(courseKey)
    if (r.whop_url && seenCourse.has(r.whop_url)) continue
    if (r.whop_url) seenCourse.add(r.whop_url)
    if (seenGuru.has(r.guru_id)) continue
    seenGuru.add(r.guru_id)
    out.push(r)
    if (out.length >= limit) break
  }
  return out
}
