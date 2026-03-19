const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Added (2026-03-06 21:45 UTC): more popular/trending trading offers w/ confirmed Whop /discover pages.
// Seed brand/offer URLs, then run /api/whop/sync to ingest offers + socials.
const urls = [
  // futures
  'https://whop.com/discover/home-of-rta/futures-trading-4e/',
  'https://whop.com/discover/futures-trading-factory/',
  'https://whop.com/discover/vip-ff-e142/',

  // options/stocks/alerts
  'https://whop.com/discover/trade-flow/',
  'https://whop.com/discover/moon-market/',
  'https://whop.com/discover/atm-bot-access/',
  'https://whop.com/discover/discord-0dte-spx-alerts/0dte-options/',

  // prop / NASDAQ rooms
  'https://whop.com/discover/aidenomics/',
  'https://whop.com/discover/rrop-course-discord/',
  'https://whop.com/discover/capital-hill-trading-discord/',
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

console.log(JSON.stringify({ inserted, skipped }, null, 2));
