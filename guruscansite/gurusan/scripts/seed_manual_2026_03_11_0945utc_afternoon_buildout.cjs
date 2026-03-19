const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Goal: add high-confidence brands/communities, then sync via /api/whop/sync.
// Notes:
// - Prefer simple /discover/<company>/ URLs.
// - Skip low-confidence/odd multi-segment URLs (offer-only pages) unless needed.
const urls = [
  // Trading
  'https://whop.com/discover/lune-trading-pro/',
  'https://whop.com/discover/apextradingsignals/',
  'https://whop.com/discover/digitalcurrencytraders/',
  'https://whop.com/discover/ftg-trading/',
  'https://whop.com/discover/ai-signals-1/',
  'https://whop.com/discover/timelessautotraders/',

  // Agency / AI
  'https://whop.com/discover/rk-develops/',
  'https://whop.com/discover/agency-accelerants/',
  'https://whop.com/discover/the-ai-agency-group/',

  // Ecom
  'https://whop.com/discover/prolific-academy-ecom/',
  'https://whop.com/discover/branded-dropshipping/',
  'https://whop.com/discover/e-bay-dropship-mastery/',

  // Other
  'https://whop.com/discover/capitaltradezae/',
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
let skipped = 0;
const insertedHandles = [];

for (const u of urls) {
  const handle = handleFromWhopUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    skipped++;
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
  insertedHandles.push(handle);
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted, skipped, insertedHandles }, null, 2));
