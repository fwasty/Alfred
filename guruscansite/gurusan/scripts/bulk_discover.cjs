#!/usr/bin/env node
/**
 * Bulk Whop Discovery — scrapes Whop discover/search pages to find new gurus.
 * Adds them to the DB with ratings, courses, and auto-generated descriptions.
 */

const Database = require('better-sqlite3')
const crypto = require('crypto')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'gurusan.db')
const db = new Database(dbPath)

function cuid() { return crypto.randomBytes(16).toString('hex') }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function rx1(raw, re) { const m = raw.match(re); return m?.[1] ?? null }

function extractBracketed(raw, startIdx, open, close) {
  let i = startIdx
  while (i < raw.length && raw[i] !== open) i++
  if (i >= raw.length) return null
  let depth = 0; const begin = i
  for (; i < raw.length; i++) {
    if (raw[i] === open) depth++
    else if (raw[i] === close) { depth--; if (depth === 0) return raw.slice(begin, i + 1) }
  }
  return null
}

const CATEGORIES_TO_SEARCH = [
  { query: 'trading', category: 'Trading' },
  { query: 'crypto', category: 'Crypto' },
  { query: 'forex', category: 'Trading' },
  { query: 'options trading', category: 'Trading' },
  { query: 'futures trading', category: 'Trading' },
  { query: 'sports betting', category: 'Sports Betting' },
  { query: 'sports picks', category: 'Sports Betting' },
  { query: 'dropshipping', category: 'Ecom' },
  { query: 'ecommerce', category: 'Ecom' },
  { query: 'amazon fba', category: 'Ecom' },
  { query: 'reselling', category: 'Ecom' },
  { query: 'ai automation', category: 'AI' },
  { query: 'smma', category: 'Agency' },
  { query: 'agency', category: 'Agency' },
  { query: 'marketing', category: 'Marketing' },
  { query: 'clipping', category: 'Clipping' },
  { query: 'content creation', category: 'Creator' },
  { query: 'real estate', category: 'Real Estate' },
]

async function discoverFromWhopSearch(query) {
  const url = `https://whop.com/search/?query=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        accept: 'text/html',
      },
    })
    if (!res.ok) return []
    const html = await res.text()

    // Extract whop routes/URLs from search results
    const routes = new Set()
    const re = /href=["']\/([a-zA-Z0-9_-]+)\/["']/g
    let m
    while ((m = re.exec(html))) {
      const route = m[1]
      if (!['search', 'discover', 'login', 'signup', 'about', 'terms', 'privacy', 'joined', 'reviews', 'marketplace'].includes(route)) {
        routes.add(route)
      }
    }

    // Also try to find routes from JSON data
    const re2 = /"route":"([a-zA-Z0-9_-]+)"/g
    while ((m = re2.exec(html))) {
      routes.add(m[1])
    }

    return [...routes]
  } catch {
    return []
  }
}

async function fetchGuruData(whopUrl) {
  try {
    const res = await fetch(whopUrl, {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        accept: 'text/html',
      },
    })
    if (!res.ok) return null
    const html = await res.text()

    const title = rx1(html, /company\\":\{[^}]*?title\\":\\"([^\\"]+)/) ||
      rx1(html, /"company":\{[^}]*?"title":"([^"]+)/) ||
      rx1(html, /property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      rx1(html, /<title>([^<]+)<\/title>/i)

    if (!title || title.includes('Page not found') || title.includes('Whop')) return null

    const bio = rx1(html, /creatorPitch\\":\\"([^\\"]+)/) || rx1(html, /"creatorPitch":"([^"]+)/)
    const reviews_average = (() => { const v = rx1(html, /reviewsAverage\\":(\d+(?:\.\d+)?)/) || rx1(html, /"reviewsAverage":(\d+(?:\.\d+)?)/); return v ? Number(v) : null })()
    const published_reviews_count = (() => { const v = rx1(html, /publishedReviewsCount\\":(\d+)/) || rx1(html, /"publishedReviewsCount":(\d+)/); return v ? Number(v) : null })()
    const review_counts = (() => { const v = rx1(html, /reviewCounts\\":\[(\d+(?:,\d+){4})\]/) || rx1(html, /"reviewCounts":\[(\d+(?:,\d+){4})\]/); return v ? v.split(',').map(Number) : null })()

    const logo = rx1(html, /rel=["']icon["'][^>]*href=["']([^"']+)["']/i) ||
      rx1(html, /property=["']og:image["'][^>]+content=["']([^"']+)["']/i)

    // Parse courses
    const courses = []
    const apIdx = html.indexOf('accessPasses')
    if (apIdx !== -1) {
      const arr = extractBracketed(html, apIdx, '[', ']')
      if (arr) {
        try {
          const json = JSON.parse(arr.replace(/\\"/g, '"'))
          for (const p of json) {
            const dp = p?.defaultPlan
            const courseName = p?.title || p?.headline
            if (!courseName) continue
            
            const highlights = (p?.productHighlights?.nodes || []).map(n => n?.content).filter(Boolean)
            let summary = ''
            if (p?.headline) summary += p.headline + '. '
            if (p?.shortenedDescription) summary += p.shortenedDescription + ' '
            if (highlights.length) summary += 'Includes: ' + highlights.slice(0, 3).join(', ') + '.'
            summary = summary.trim().slice(0, 400)

            courses.push({
              name: courseName,
              image_url: p?.filePicture?.sourceUrl || null,
              price_cents: typeof dp?.initialPriceDueInCents === 'number' ? dp.initialPriceDueInCents : null,
              reviews_average: typeof p?.reviewsAverage === 'number' ? p.reviewsAverage : null,
              published_reviews_count: typeof p?.publishedReviewsCount === 'number' ? p.publishedReviewsCount : null,
              review_counts: Array.isArray(p?.reviewCounts) ? p.reviewCounts.map(Number) : null,
              summary: summary || null,
            })
          }
        } catch {}
      }
    }

    return { title, bio, reviews_average, published_reviews_count, review_counts, logo, courses }
  } catch {
    return null
  }
}

function generateDescription(name, category, courses) {
  const catDescriptions = {
    'Trading': 'trading education, market analysis, and live trade signals',
    'Crypto': 'cryptocurrency trading signals, market analysis, and crypto education',
    'Ecom': 'e-commerce education, dropshipping strategies, and online selling techniques',
    'Sports Betting': 'sports picks, betting analysis, and wagering strategies',
    'Clipping': 'content clipping opportunities, video editing, and creator monetization',
    'AI': 'AI tools, automation workflows, and artificial intelligence education',
    'Agency': 'agency building, client acquisition, and service-based business growth',
    'Marketing': 'digital marketing strategies, growth hacking, and advertising techniques',
    'Business': 'business education, entrepreneurship, and income generation',
    'Creator': 'content creation, social media growth, and creator economy',
    'Real Estate': 'real estate investing, property strategies, and wealth building',
    'Other': 'online education and premium community access',
  }

  const catDesc = catDescriptions[category] || 'online education and community access'
  let desc = `${name} provides ${catDesc}.`

  if (courses.length > 0) {
    const uniqueCourses = courses
      .map(c => c.name.trim())
      .filter(c => c.toLowerCase() !== name.toLowerCase() && c.length > 3)
      .slice(0, 3)
    if (uniqueCourses.length > 0) {
      desc += ` Offers include ${uniqueCourses.join(', ')}.`
    }
  }

  // Add review context
  const totalReviews = courses.reduce((sum, c) => sum + (c.published_reviews_count || 0), 0)
  if (totalReviews > 100) {
    desc += ` Community-reviewed with ${totalReviews.toLocaleString()}+ reviews on Whop.`
  } else if (totalReviews > 0) {
    desc += ` Reviewed by the community on Whop.`
  }

  return desc.slice(0, 500)
}

async function main() {
  const existingHandles = new Set(
    db.prepare('SELECT handle FROM gurus WHERE handle IS NOT NULL').all().map(r => r.handle)
  )

  let totalAdded = 0
  let totalSkipped = 0

  for (const { query, category } of CATEGORIES_TO_SEARCH) {
    console.log(`\n[discover] Searching: "${query}" → ${category}`)
    const routes = await discoverFromWhopSearch(query)
    console.log(`  Found ${routes.length} routes`)

    let addedThisQuery = 0

    for (const route of routes) {
      if (existingHandles.has(route)) {
        totalSkipped++
        continue
      }

      if (addedThisQuery >= 15) break // cap per query to avoid hammering

      const whopUrl = `https://whop.com/${route}/`
      const data = await fetchGuruData(whopUrl)

      if (!data || !data.title) {
        await sleep(1500)
        continue
      }

      // Skip if very few reviews (likely not a real course)
      const totalReviews = data.published_reviews_count || 0

      const ts = Date.now()
      const guruId = cuid()
      const handle = route

      const bio = data.bio || generateDescription(data.title, category, data.courses)

      db.prepare(
        `INSERT OR IGNORE INTO gurus (id, name, handle, category, bio, whop_url, image_url, 
         whop_rating, whop_reviews_count, whop_star_counts, whop_synced_at, verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      ).run(
        guruId, data.title, handle, category, bio, whopUrl, data.logo,
        data.reviews_average, data.published_reviews_count,
        data.review_counts ? JSON.stringify(data.review_counts) : null,
        ts, ts, ts
      )

      existingHandles.add(handle)

      // Add courses
      for (const c of data.courses) {
        const courseId = cuid()
        const existing = db.prepare('SELECT id FROM courses WHERE guru_id=? AND lower(TRIM(name))=lower(TRIM(?)) LIMIT 1').get(guruId, c.name)
        if (!existing) {
          db.prepare(
            `INSERT INTO courses (id, guru_id, name, whop_url, image_url, price_cents, 
             whop_rating, whop_reviews_count, whop_star_counts, summary, whop_synced_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            courseId, guruId, c.name, whopUrl, c.image_url, c.price_cents,
            c.reviews_average, c.published_reviews_count,
            c.review_counts ? JSON.stringify(c.review_counts) : null,
            c.summary, ts, ts, ts
          )
        }
      }

      totalAdded++
      addedThisQuery++
      console.log(`  [+] ${data.title} (@${handle}) — ${data.reviews_average || '—'}★ (${totalReviews} reviews, ${data.courses.length} courses)`)

      await sleep(2000) // rate limit
    }
  }

  console.log(`\n[discover] Done — ${totalAdded} new gurus added, ${totalSkipped} already existed`)

  const count = db.prepare('SELECT COUNT(*) as c FROM gurus WHERE COALESCE(hidden,0)=0').get()
  console.log(`Total visible gurus: ${count.c}`)
}

main().catch(err => {
  console.error('[discover] Fatal:', err)
  process.exit(1)
})
