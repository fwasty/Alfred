const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Added (2026-03-06 late afternoon): high-confidence Whop pages (mostly canonical /<handle>/ routes)
// so /api/whop/sync can reliably ingest offers + socials.
const urls = [
  // Canonical brand/company pages
  'https://whop.com/exclusivefuturestrading/',
  'https://whop.com/aftermidnight/',
  'https://whop.com/tradingmentorship/',
  'https://whop.com/killerwhaleventures/',
  'https://whop.com/options-signals-education/',
  'https://whop.com/rawstocks/',

  // Discover-only pages (still fine for ingest)
  'https://whop.com/discover/free-discord-c7-585b/',
  'https://whop.com/discover/adt/futures-8d/',
  'https://whop.com/discover/option-signals-5a/',
  'https://whop.com/discover/ciphers-ifvg-trading-course/',
  'https://whop.com/discover/tradingmentorship/free-community-6e-fcf3/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

let inserted = 0;
let updated = 0;
for (const u of urls) {
  // Prefer the canonical company handle for certain URLs.
  let handle = handleFromUrl(u);

  // If URL is .../discover/<company>/<product>/, seed the company-level handle when we have it.
  // Otherwise we keep the last segment.
  if (u.includes('/discover/tradingmentorship/')) handle = 'tradingmentorship';

  const existing = db.prepare('SELECT id, whop_url FROM gurus WHERE handle = ?').get(handle);
  const ts = now();

  if (existing) {
    // Keep existing URL unless missing; but if this is a canonical /<handle>/, upgrade to it.
    const canonical = u.match(/^https:\/\/whop\.com\/[^/]+\/$/) ? u : null;
    const nextUrl = canonical || existing.whop_url || u;
    db.prepare('UPDATE gurus SET whop_url = ?, updated_at = ? WHERE handle = ?')
      .run(nextUrl, ts, handle);
    updated++;
    console.log('Updated', handle, '->', nextUrl);
    continue;
  }

  const id = cuid();
  const name = handle.replace(/-/g, ' ');

  db.prepare(
    `INSERT INTO gurus (
      id, name, handle, category, bio, whop_url, whop_synced_at,
      creator_name, brand_name,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    handle,
    'Whop',
    null,
    u,
    null,
    null,
    name,
    ts,
    ts
  );
  inserted++;
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted, updated }, null, 2));
