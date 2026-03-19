const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Source: Whop blog roundups (high confidence) + direct Whop marketplace links.
// Goal: add high-confidence brands/communities, then sync via /api/whop/sync.
const urls = [
  // Trading (from Whop blog lists)
  'https://whop.com/discover/playbit/',
  'https://whop.com/discover/emmanueltrades/',
  'https://whop.com/discover/chroma-trading/',
  'https://whop.com/discover/korvato-2/',

  // Ecommerce / Amazon FBA (from Whop blog list)
  'https://whop.com/marketplace/arbitrage-ops/',
  'https://whop.com/marketplace/thc/',
  'https://whop.com/marketplace/primeprophets/',
  'https://whop.com/marketplace/the-fba-roadmap-3/',
  'https://whop.com/marketplace/the-buy-box/',
  'https://whop.com/marketplace/livecops/',
  'https://whop.com/marketplace/sellercentralboys/',
];

function handleFromWhopUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/, '');
  const url = new URL(clean);
  const parts = url.pathname.split('/').filter(Boolean);

  // /discover/<company>/<offer>
  if (parts[0] === 'discover' && parts[1]) return parts[1].toLowerCase();

  // /marketplace/<company>
  if (parts[0] === 'marketplace' && parts[1]) return parts[1].toLowerCase();

  // /joined/<company>
  if (parts[0] === 'joined' && parts[1]) return parts[1].toLowerCase();

  // /<company>/...
  return (parts[0] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromWhopUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    console.log('Skip existing', handle);
    continue;
  }

  const id = cuid();
  const ts = now();
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

console.log(`Done. Inserted ${inserted} new gurus.`);
