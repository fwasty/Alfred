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
// - Prefer /discover/<company>/<offer>/ URLs where possible.
// - Skip anything that 404s or looks like a generic category/collection.
const urls = [
  // Trading / markets
  'https://whop.com/discover/the-chamber/join-free-discord/',
  'https://whop.com/discover/advanced-price-action-course/free-trading-discord-community/',

  // Reselling / marketplaces
  'https://whop.com/discover/resellkings/retail-world/',
  'https://whop.com/discover/evsresells/evs-free-discord/',
  'https://whop.com/discover/resellradaruk/',
  'https://whop.com/discover/the-new-generation-money/',
  'https://whop.com/discover/logify/',
  'https://whop.com/discover/free-community-e7-84ac/',

  // AI / agency
  'https://whop.com/discover/startgrowsell-ai/',
  'https://whop.com/discover/ai-academy/ai-incubator/',
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
