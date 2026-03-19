const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Friday 2026-03-13 afternoon/eod build-out — high-confidence Whop pages (public discover product pages).
const whopUrls = [
  'https://whop.com/discover/dr-dollar-mentorship-vip/all-freedom-signals/',
  'https://whop.com/discover/mrquinville/live-trading-room-f3/',
  'https://whop.com/discover/quant-club-trading-copy-0d/futures-options-signals/',
  'https://whop.com/discover/prisma-crypto-signals/stock-options-trading-7f/',
  'https://whop.com/discover/uris-trading/discord-trading-room/',
  'https://whop.com/discover/full-access-monthly-73/advancedsignals/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of whopUrls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    console.log('Skip existing', handle, u);
    continue;
  }
  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (
      id, name, handle, category, bio, whop_url, whop_synced_at,
      creator_name, brand_name,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    handle.replace(/-/g,' '),
    handle,
    'Whop',
    null,
    u,
    null,
    null,
    handle.replace(/-/g,' '),
    ts,
    ts
  );
  console.log('Inserted', handle, u);
  inserted++;
}

console.log('Done. Inserted:', inserted);
