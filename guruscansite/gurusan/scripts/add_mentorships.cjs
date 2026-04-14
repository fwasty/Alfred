#!/usr/bin/env node
/**
 * Add mentorship/trading communities from Whop.
 * Focuses on mentorship-style groups with real reviews.
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

// Mentorship-focused routes to discover
const ROUTES = [
  { route: 'moore-trades-fa32', category: 'Trading' },
  // Trading mentorships
  { route: 'thefxjunior', category: 'Trading' },
  { route: 'topstep', category: 'Trading' },
  { route: 'apex-trader-funding', category: 'Trading' },
  { route: 'tradingview', category: 'Trading' },
  { route: 'thetradinggeek', category: 'Trading' },
  { route: 'tradeify', category: 'Trading' },
  { route: 'funded-next', category: 'Trading' },
  { route: 'astro-forex', category: 'Trading' },
  { route: 'phantom-trading', category: 'Trading' },
  { route: 'wicksdontlie', category: 'Trading' },
  { route: 'nurp', category: 'Trading' },
  { route: 'carmine-rosato', category: 'Trading' },
  { route: 'tradeconnect', category: 'Trading' },
  // Crypto mentorships
  { route: 'altcoin-sherpa', category: 'Crypto' },
  { route: 'satoshi-traders', category: 'Crypto' },
  { route: 'crypto-banter', category: 'Crypto' },
  { route: 'defi-education', category: 'Crypto' },
  { route: 'coin-bureau', category: 'Crypto' },
  { route: 'cryptomaniaks', category: 'Crypto' },
  // Ecom mentorships
  { route: 'ac-hampton', category: 'Ecom' },
  { route: 'trevin-peterson', category: 'Ecom' },
  { route: 'wholesale-formula', category: 'Ecom' },
  { route: 'ecom-academy', category: 'Ecom' },
  // Sports
  { route: 'picks-and-parlays', category: 'Sports Betting' },
  { route: 'thesportsgeek', category: 'Sports Betting' },
  { route: 'sharp-plays', category: 'Sports Betting' },
  // Agency/marketing
  { route: 'agency-navigator', category: 'Agency' },
  { route: 'alex-hormozi', category: 'Business' },
  { route: 'skool-games', category: 'Business' },
  { route: 'sam-ovens', category: 'Agency' },
]

async function fetchAndAdd(route, category) {
  const whopUrl = `https://whop.com/${route}/`
  try {
    const res = await fetch(whopUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36', accept: 'text/html' }
    })
    if (!res.ok) return null
    const html = await res.text()

    let title = rx1(html, /company\\":\{[^}]*?title\\":\\"([^\\"]+)/) ||
      rx1(html, /"company":\{[^}]*?"title":"([^"]+)/) ||
      rx1(html, /property=["']og:title["'][^>]+content=["']([^"']+)["']/i)

    if (!title || title.includes('Page not found') || title.includes('Vercel') || title.includes('Security Checkpoint') || title.includes('Discover | Whop')) return null
    // Clean generic Whop titles
    if (title.includes('Whop: Start a Business')) {
      title = route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(/\s+\w{4,}$/, '')
    }

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

    // Generate unique description
    const catMap = {
      'Trading': 'trading mentorship, market analysis, and live trade execution',
      'Crypto': 'cryptocurrency trading education, signals, and market insights',
      'Ecom': 'e-commerce mentorship, dropshipping, and online business strategies',
      'Sports Betting': 'sports betting picks, analysis, and wagering strategies',
      'AI': 'AI automation, tools, and artificial intelligence education',
      'Agency': 'agency building, client acquisition, and service business scaling',
      'Business': 'business education, entrepreneurship, and growth strategies',
    }
    const catDesc = catMap[category] || 'online education and mentorship'
    let description = bio || `${title} offers ${catDesc}.`
    if (!bio && courses.length > 0) {
      const names = courses.map(c => c.name).filter(c => c.toLowerCase() !== title.toLowerCase()).slice(0, 2)
      if (names.length) description += ` Programs include ${names.join(' and ')}.`
    }
    if (!bio && (published_reviews_count || 0) > 20) {
      description += ` Reviewed by ${published_reviews_count}+ members on Whop.`
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
  } catch { return null }
}

async function main() {
  const existing = new Set(db.prepare('SELECT handle FROM gurus WHERE handle IS NOT NULL').all().map(r => r.handle))
  let added = 0, skipped = 0

  for (const { route, category } of ROUTES) {
    if (existing.has(route)) { skipped++; continue }
    const result = await fetchAndAdd(route, category)
    if (result) {
      added++
      console.log(`[+] ${result.title} (@${route}) — ${result.reviews_average || '—'}★ (${result.published_reviews_count || 0} reviews, ${result.courses} courses)`)
    } else {
      console.log(`[-] @${route} — not found`)
    }
    await sleep(2000)
  }

  console.log(`\nDone: ${added} added, ${skipped} already existed`)
  const total = db.prepare('SELECT COUNT(*) as c FROM gurus WHERE COALESCE(hidden,0)=0').get()
  console.log(`Total visible gurus: ${total.c}`)
}

main().catch(console.error)
