import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/sqlite'
import { searchCreators, searchCourses, searchGurus, listCoursesForGuru, getGuruByHandle } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  const parsed = z.string().min(1).max(80).safeParse(q)
  if (!parsed.success) return NextResponse.json({ data: [] })

  const query = parsed.data.trim()
  const qLower = query.toLowerCase()

  // Special-case: if the query clearly matches a single Whop brand handle,
  // return a tight set: brand + its courses (prevents noisy multi-results).
  const directGuru = db
    .prepare(
      `SELECT handle
       FROM gurus
       WHERE COALESCE(hidden,0)=0
         AND lower(handle) = ?
       LIMIT 1`
    )
    .get(qLower) as any

  const directByCreatorName = db
    .prepare(
      `SELECT handle
       FROM gurus
       WHERE COALESCE(hidden,0)=0
         AND (lower(COALESCE(creator_name,'')) = ? OR lower(name) = ?)
       ORDER BY COALESCE(whop_reviews_count,0) DESC
       LIMIT 1`
    )
    .get(qLower, qLower) as any

  const focusHandle = (directGuru?.handle || directByCreatorName?.handle) as string | undefined

  if (focusHandle) {
    const g = getGuruByHandle(focusHandle)
    if (g) {
      const brand = {
        type: 'brand' as const,
        name: g.brand_name || g.name,
        key: `brand:${g.handle}`,
        href: `/gurus/${g.handle}`,
        image_url: g.image_url,
        sub: g.creator_name ? `by ${g.creator_name}` : 'Brand',
      }

      const courses = listCoursesForGuru(g.id)
        .slice(0, 3)
        .map((c) => ({
          type: 'course' as const,
          name: c.name,
          key: `course:${c.id}`,
          href: `/courses/${c.id}`,
          image_url: c.image_url,
          sub: g.creator_name ? `by ${g.creator_name}` : `by ${g.name}`,
        }))

      return NextResponse.json({ data: [brand, ...courses].slice(0, 6) })
    }
  }

  const creators = searchCreators(query, 5).map((c) => ({
    type: 'creator' as const,
    name: c.name,
    key: `creator:${c.slug}`,
    href: `/creators/${c.slug}`,
    image_url: c.image_url,
    sub: 'Creator',
  }))

  const gurus = searchGurus(query, 5).map((g) => ({
    type: 'brand' as const,
    name: g.brand_name || g.name,
    key: `brand:${g.handle}`,
    href: `/gurus/${g.handle}`,
    image_url: g.image_url,
    sub: g.creator_name ? `by ${g.creator_name}` : 'Brand',
  }))

  const courses = searchCourses(query, 5).map((c) => ({
    type: 'course' as const,
    name: c.name,
    key: `course:${c.id}`,
    href: `/courses/${c.id}`,
    image_url: c.image_url,
    sub: c.creator_name ? `by ${c.creator_name}` : `by ${c.guru_name}`,
  }))

  // Dedupe exact hrefs to avoid “same thing twice”
  const all = [...courses, ...gurus, ...creators]
  const seen = new Set<string>()
  const data = [] as typeof all
  for (const r of all) {
    if (seen.has(r.href)) continue
    seen.add(r.href)
    data.push(r)
    if (data.length >= 8) break
  }

  return NextResponse.json({ data })
}
