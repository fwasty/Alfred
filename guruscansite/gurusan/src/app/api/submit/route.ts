import { NextResponse } from 'next/server'
import { db } from '@/lib/sqlite'
import { getSessionUserId } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { cuid, now } from '@/lib/ids'

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Login required to submit a course' }, { status: 401 })

  // Rate limit: 5 submissions per hour per user
  const rl = rateLimit(`submit:${userId}`, 5, 60 * 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const whopUrl = typeof body?.whopUrl === 'string' ? body.whopUrl.trim() : null
  if (!whopUrl) return NextResponse.json({ error: 'Whop URL is required' }, { status: 400 })

  // Validate it looks like a Whop URL
  let route: string | null = null
  try {
    const u = new URL(whopUrl)
    if (!u.hostname.includes('whop.com')) return NextResponse.json({ error: 'Must be a whop.com URL' }, { status: 400 })
    const parts = u.pathname.split('/').filter(Boolean)
    route = parts[0] || null
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  if (!route || route.length < 2) return NextResponse.json({ error: 'Could not extract guru handle from URL' }, { status: 400 })

  // Check if already exists
  const existing = db.prepare('SELECT id, name, handle, hidden FROM gurus WHERE handle = ?').get(route) as any
  if (existing && !existing.hidden) {
    return NextResponse.json({ 
      error: 'This guru is already listed!',
      handle: existing.handle,
      redirect: `/gurus/${existing.handle}`
    }, { status: 409 })
  }

  // If it was hidden, unhide it
  if (existing && existing.hidden) {
    db.prepare('UPDATE gurus SET hidden=0, updated_at=? WHERE id=?').run(now(), existing.id)
    return NextResponse.json({ 
      ok: true, 
      message: `${existing.name} has been re-listed!`,
      handle: existing.handle,
      redirect: `/gurus/${existing.handle}`
    })
  }

  // Try to scrape from Whop
  let guruName = route.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  let bio: string | null = null
  let imageUrl: string | null = null
  let whopRating: number | null = null
  let whopReviewsCount: number | null = null
  let category = 'Other'

  try {
    const res = await fetch(`https://whop.com/${route}/`, {
      headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36', accept: 'text/html' },
    })
    if (res.ok) {
      const html = await res.text()
      
      // Safety: skip if Vercel security page
      if (!html.includes('Vercel') && !html.includes('Security Checkpoint')) {
        const rx = (re: RegExp) => { const m = html.match(re); return m?.[1] ?? null }
        
        const title = rx(/company\\":\{[^}]*?title\\":\\"([^\\"]+)/) || rx(/"company":\{[^}]*?"title":"([^"]+)/)
        if (title && !title.includes('Vercel')) guruName = title
        
        bio = rx(/creatorPitch\\":\\"([^\\"]+)/) || rx(/"creatorPitch":"([^"]+)/)
        
        const rating = rx(/reviewsAverage\\":(\d+(?:\.\d+)?)/) || rx(/"reviewsAverage":(\d+(?:\.\d+)?)/)
        if (rating) whopRating = Number(rating)
        
        const reviews = rx(/publishedReviewsCount\\":(\d+)/) || rx(/"publishedReviewsCount":(\d+)/)
        if (reviews) whopReviewsCount = Number(reviews)
        
        const logo = rx(/rel=["']icon["'][^>]*href=["']([^"']+)["']/i)
        if (logo && !logo.includes('.gif') && !logo.includes('favicon')) imageUrl = logo
      }
    }
  } catch { /* scrape failed, use defaults */ }

  // Auto-categorize from name/bio
  const text = (guruName + ' ' + (bio || '')).toLowerCase()
  if (/trading|trader|futures|options|stocks|forex|scalp|swing/.test(text)) category = 'Trading'
  else if (/crypto|defi|bitcoin|token|blockchain/.test(text)) category = 'Crypto'
  else if (/ecom|dropship|amazon|fba|shopify|resell/.test(text)) category = 'Ecom'
  else if (/sport|bet|pick|parlay/.test(text)) category = 'Sports Betting'
  else if (/clip|clipping/.test(text)) category = 'Clipping'
  else if (/ai |automat|gpt/.test(text)) category = 'AI'
  else if (/agency|smma|client/.test(text)) category = 'Agency'
  else if (/market|seo|ads/.test(text)) category = 'Marketing'
  else if (/creator|tiktok|youtube|content/.test(text)) category = 'Creator'
  else if (/real estate|property/.test(text)) category = 'Real Estate'
  else if (/business|entrepreneur|money/.test(text)) category = 'Business'

  if (!bio) bio = `${guruName} offers online education and community access. Submitted by the Guru Scan community.`

  const ts = now()
  const id = cuid()

  db.prepare(
    `INSERT INTO gurus (id,name,handle,category,bio,whop_url,image_url,whop_rating,whop_reviews_count,whop_synced_at,verified,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)`
  ).run(id, guruName, route, category, bio, `https://whop.com/${route}/`, imageUrl, whopRating, whopReviewsCount, ts, ts, ts)

  return NextResponse.json({
    ok: true,
    message: `${guruName} has been added to Guru Scan!`,
    handle: route,
    redirect: `/gurus/${route}`
  })
}
