import { db } from '@/lib/sqlite'

export default function sitemap() {
  const baseUrl = 'https://guruscan.xyz'

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/gurus`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/list-your-course`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/clipping`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
  ]

  // Dynamic guru pages
  const gurus = db.prepare(
    "SELECT handle, updated_at FROM gurus WHERE COALESCE(hidden,0)=0 AND handle IS NOT NULL ORDER BY COALESCE(whop_reviews_count,0) DESC"
  ).all() as { handle: string; updated_at: number }[]

  const guruPages = gurus.map((g) => ({
    url: `${baseUrl}/gurus/${g.handle}`,
    lastModified: new Date(g.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...guruPages]
}
