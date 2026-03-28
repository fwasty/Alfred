#!/usr/bin/env node
/**
 * Bulk discovery v2 — uses a curated list of known Whop routes found via search.
 * Fetches each one, extracts data, adds to DB with unique descriptions.
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
  let i = startIdx; while (i < raw.length && raw[i] !== open) i++;
  if (i >= raw.length) return null; let depth = 0; const begin = i;
  for (; i < raw.length; i++) { if (raw[i] === open) depth++; else if (raw[i] === close) { depth--; if (depth === 0) return raw.slice(begin, i + 1) } }
  return null
}

// Curated list of Whop routes to add, organized by category
const ROUTES = [
  // Crypto
  { route: 'kaizen-crypto', category: 'Crypto' },
  { route: 'thealphaclub-free', category: 'Crypto' },
  { route: 'top-tier-signals', category: 'Crypto' },
  { route: '3m-trading', category: 'Crypto' },
  { route: 'potion-alpha', category: 'Crypto' },
  { route: 'the-whale-room', category: 'Crypto' },
  { route: 'wolf-pack-elite', category: 'Crypto' },
  { route: 'dragons-club', category: 'Crypto' },
  { route: 'crypto-trading-club', category: 'Crypto' },
  { route: 'the-digest', category: 'Crypto' },
  // Trading
  { route: 'atlas-trading', category: 'Trading' },
  { route: 'warrior-trading', category: 'Trading' },
  { route: 'humbled-trader', category: 'Trading' },
  { route: 'sievert-trading', category: 'Trading' },
  { route: 'thestocktradinglab', category: 'Trading' },
  { route: 'bear-bull-traders', category: 'Trading' },
  { route: 'ziptrader', category: 'Trading' },
  { route: 'ichimoku-traders', category: 'Trading' },
  { route: 'gorilla-trades', category: 'Trading' },
  { route: 'trade-pro-academy', category: 'Trading' },
  // Sports Betting
  { route: 'oddsjam', category: 'Sports Betting' },
  { route: 'betstamp', category: 'Sports Betting' },
  { route: 'unabated-sports', category: 'Sports Betting' },
  { route: 'prime-sports', category: 'Sports Betting' },
  { route: 'bet-karma', category: 'Sports Betting' },
  // Ecom
  { route: 'wholesale-ted', category: 'Ecom' },
  { route: 'kevin-zhang', category: 'Ecom' },
  { route: 'jordan-welch', category: 'Ecom' },
  { route: 'ecom-king', category: 'Ecom' },
  { route: 'biaheza', category: 'Ecom' },
  // AI
  { route: 'ai-guys', category: 'AI' },
  { route: 'promptbase', category: 'AI' },
  { route: 'ai-mastery', category: 'AI' },
  // Agency/Marketing
  { route: 'ghl-masters', category: 'Agency' },
  { route: 'iman-gadzhi', category: 'Agency' },
  { route: 'client-ascension', category: 'Agency' },
]

async function fetchAndAdd(route, category) {
  const whopUrl = `https://whop.com/${route}/`
  
  const res = await fetch(whopUrl, {
    headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36', accept: 'text/html' }
  })
  if (!res.ok) return null
  const html = await res.text()

  const title = rx1(html, /company\\":\{[^}]*?title\\":\\"([^\\"]+)/) ||
    rx1(html, /"company":\{[^}]*?"title":"([^"]+)/) ||
    rx1(html, /property=["']og:title["'][^>]+content=["']([^"']+)["']/i)

  if (!title || title.includes('Page not found')) return null

  const bio = rx1(html, /creatorPitch\\":\\"([^\\"]+)/) || rx1(html, /"creatorPitch":"([^"]+)/)
  const reviews_average = (() => { const v = rx1(html, /reviewsAverage\\":(\d+(?:\.\d+)?)/) || rx1(html, /"reviewsAverage":(\d+(?:\.\d+)?)/); return v ? Number(v) : null })()
  const published_reviews_count = (() => { const v = rx1(html, /publishedReviewsCount\\":(\d+)/) || rx1(html, /"publishedReviewsCount":(\d+)/); return v ? Number(v) : null })()
  const review_counts = (() => { const v = rx1(html, /reviewCounts\\":\[(\d+(?:,\d+){4})\]/) || rx1(html, /"reviewCounts":\[(\d+(?:,\d+){4})\]/); return v ? v.split(',').map(Number) : null })()
  const logo = rx1(html, /rel=["']icon["'][^>]*href=["']([^"']+)["']/i) || rx1(html, /property=["']og:image["'][^>]+content=["']([^"']+)["']/i)

  const courses = []
  const apIdx = html.indexOf('accessPasses')
  if (apIdx !== -1) {
    const arr = extractBracketed(html, apIdx, '[', ']')
    if (arr) {
      try {
        const json = JSON.parse(arr.replace(/\\"/g, '"'))
        for (const p of json) {
          const dp = p?.defaultPlan
          const name = p?.title || p?.headline
          if (!name) continue
          const highlights = (p?.productHighlights?.nodes || []).map(n => n?.content).filter(Boolean)
          let summary = ''
          if (p?.headline) summary += p.headline + '. '
          if (p?.shortenedDescription) summary += p.shortenedDescription + ' '
          if (highlights.length) summary += 'Highlights: ' + highlights.slice(0, 3).join(', ') + '.'
          courses.push({
            name, image_url: p?.filePicture?.sourceUrl || null,
            price_cents: typeof dp?.initialPriceDueInCents === 'number' ? dp.initialPriceDueInCents : null,
            reviews_average: typeof p?.reviewsAverage === 'number' ? p.reviewsAverage : null,
            published_reviews_count: typeof p?.publishedReviewsCount === 'number' ? p.publishedReviewsCount : null,
            review_counts: Array.isArray(p?.reviewCounts) ? p.reviewCounts.map(Number) : null,
            summary: summary.trim().slice(0, 400) || null,
          })
        }
      } catch {}
    }
  }

  // Generate description
  const catMap = {
    'Trading': 'trading education, market analysis, and live trade signals',
    'Crypto': 'cryptocurrency trading signals, market insights, and crypto education',
    'Ecom': 'e-commerce education, dropshipping strategies, and online business',
    'Sports Betting': 'sports picks, betting analysis, and wagering strategies',
    'AI': 'AI automation, tools, and artificial intelligence education',
    'Agency': 'agency building, client acquisition, and service business growth',
    'Marketing': 'digital marketing, growth strategies, and advertising',
    'Creator': 'content creation, social media growth, and monetization',
  }
  const catDesc = catMap[category] || 'online education and premium community access'
  let description = bio || `${title} specializes in ${catDesc}.`
  if (courses.length > 0 && !bio) {
    const names = courses.map(c => c.name).filter(c => c.toLowerCase() !== title.toLowerCase()).slice(0, 2)
    if (names.length) description += ` Offers include ${names.join(' and ')}.`
  }
  if ((published_reviews_count || 0) > 50 && !bio) {
    description += ` Community-validated with ${published_reviews_count.toLocaleString()}+ reviews on Whop.`
  }

  const ts = Date.now()
  const guruId = cuid()
  
  db.prepare(
    `INSERT OR IGNORE INTO gurus (id,name,handle,category,bio,whop_url,image_url,whop_rating,whop_reviews_count,whop_star_counts,whop_synced_at,verified,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?)`
  ).run(guruId, title, route, category, description, whopUrl, logo, reviews_average, published_reviews_count, review_counts ? JSON.stringify(review_counts) : null, ts, ts, ts)

  for (const c of courses) {
    const cid = cuid()
    db.prepare(
      `INSERT OR IGNORE INTO courses (id,guru_id,name,whop_url,image_url,price_cents,whop_rating,whop_reviews_count,whop_star_counts,summary,whop_synced_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(cid, guruId, c.name, whopUrl, c.image_url, c.price_cents, c.reviews_average, c.published_reviews_count, c.review_counts ? JSON.stringify(c.review_counts) : null, c.summary, ts, ts, ts)
  }

  return { title, reviews_average, published_reviews_count, courses: courses.length }
}

async function main() {
  const existing = new Set(db.prepare('SELECT handle FROM gurus WHERE handle IS NOT NULL').all().map(r => r.handle))
  let added = 0, skipped = 0

  for (const { route, category } of ROUTES) {
    if (existing.has(route)) { skipped++; continue }
    
    try {
      const result = await fetchAndAdd(route, category)
      if (result) {
        added++
        console.log(`[+] ${result.title} (@${route}) — ${result.reviews_average || '—'}★ (${result.published_reviews_count || 0} reviews, ${result.courses} courses)`)
      } else {
        console.log(`[-] @${route} — not found or empty`)
      }
    } catch(e) {
      console.log(`[!] @${route} — error: ${e.message}`)
    }
    
    await sleep(2000)
  }

  console.log(`\nDone: ${added} added, ${skipped} already existed`)
  const total = db.prepare('SELECT COUNT(*) as c FROM gurus WHERE COALESCE(hidden,0)=0').get()
  console.log(`Total visible gurus: ${total.c}`)
}

main().catch(console.error)
