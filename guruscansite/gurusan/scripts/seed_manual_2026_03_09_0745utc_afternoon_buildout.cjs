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
// - Skip anything that looks like a generic category/collection.
const urls = [
  // Trading (from Whop "Top trading Discord servers" post)
  'https://whop.com/discover/thehaven/',
  'https://whop.com/discover/moneymotive/',
  'https://whop.com/discover/fu-money-club/',
  'https://whop.com/discover/sniper-trades/',
  'https://whop.com/discover/oculus-trading-vip-weekly/',
  'https://whop.com/discover/eztrades/',
  'https://whop.com/discover/fli-capital/',
  'https://whop.com/discover/coldbloodedtraders/',
  'https://whop.com/discover/pbtrading-free/',
  'https://whop.com/discover/champs-only/',
  'https://whop.com/discover/twi-free/',

  // Reselling (from Whop "Best reselling Discord servers" post)
  'https://whop.com/discover/stellaraio/',
  'https://whop.com/discover/profitlounge/',
  'https://whop.com/discover/frugal-szn-1/',
  'https://whop.com/discover/shocked/',
  'https://whop.com/discover/gfnf/',
  'https://whop.com/discover/heatseekers/',
  'https://whop.com/discover/hidden-trading/',
  'https://whop.com/discover/lab/',
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
