#!/usr/bin/env node
/**
 * Fetch images for gurus using Brave Search API
 */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')

const dbPath = path.join(__dirname, '..', 'gurusan.db')
const db = new Database(dbPath)
const brandDir = path.join(__dirname, '..', 'public', 'brand')

const BRAVE_API_KEY = 'BSAe-EzFAAau_ccxO4iJYBSqP32mLDM'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function searchImage(query) {
  const url = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=3&safesearch=strict`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': BRAVE_API_KEY }
  })
  if (!res.ok) return null
  const data = await res.json()
  const results = data?.results || []
  // Find a good image - prefer square-ish, reasonable size
  for (const r of results) {
    const url = r?.properties?.url || r?.thumbnail?.src
    if (!url) continue
    if (url.includes('.gif')) continue
    if (url.includes('favicon')) continue
    return url
  }
  return null
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        if (buf.length < 2000) { reject(new Error('Too small')); return }
        fs.writeFileSync(filepath, buf)
        resolve(buf.length)
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  const gurus = db.prepare(
    'SELECT name, handle, whop_url FROM gurus WHERE COALESCE(hidden,0)=0 AND image_url IS NULL ORDER BY COALESCE(whop_reviews_count,0) DESC LIMIT 20'
  ).all()

  console.log(`Fetching images for ${gurus.length} gurus...`)
  let found = 0

  for (const g of gurus) {
    const queries = [
      `${g.name} whop logo`,
      `${g.name} trading community logo`,
      `${g.name} brand logo`,
    ]

    let imageUrl = null
    for (const q of queries) {
      imageUrl = await searchImage(q)
      if (imageUrl) break
      await sleep(500)
    }

    if (!imageUrl) {
      console.log(`  ❌ ${g.name} - no image found`)
      await sleep(1000)
      continue
    }

    const ext = imageUrl.includes('.png') ? 'png' : 'jpg'
    const filename = `${g.handle}.${ext}`
    const filepath = path.join(brandDir, filename)

    try {
      const size = await downloadImage(imageUrl, filepath)
      db.prepare('UPDATE gurus SET image_url=?, updated_at=? WHERE handle=?')
        .run(`/brand/${filename}`, Date.now(), g.handle)
      found++
      console.log(`  ✅ ${g.name} - ${(size/1024).toFixed(0)}KB → /brand/${filename}`)
    } catch (e) {
      console.log(`  ❌ ${g.name} - download failed: ${e.message}`)
    }

    await sleep(1500) // rate limit
  }

  console.log(`\nDone: ${found}/${gurus.length} images found`)
}

main().catch(console.error)
