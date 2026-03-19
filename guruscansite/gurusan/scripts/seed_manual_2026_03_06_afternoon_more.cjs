const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Added (2026-03-06 afternoon): additional popular Whop brands w/ confirmed /discover pages.
// Keep list conservative: only high-confidence, clearly active pages.
const urls = [
  // Trading
  'https://whop.com/discover/home-of-rta/futures-trading-4e/',
  'https://whop.com/discover/indexfutures/',
  'https://whop.com/discover/futures-56/',
  'https://whop.com/discover/ict-ifvg-course/on-futures-trading/',
  'https://whop.com/discover/trader-21-official/',
  'https://whop.com/discover/tradingsimple/',
  'https://whop.com/discover/fasttrack-forex/',

  // Ecommerce / online money
  'https://whop.com/discover/8-figures-complete-blueprints/ecomsquad/',
  'https://whop.com/discover/divine/',
  'https://whop.com/discover/ecom-club-official/',
  'https://whop.com/discover/exposcale-free-community/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

let inserted = 0;
let skipped = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
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
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted, skipped }, null, 2));
