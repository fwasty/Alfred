const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// 2026-03-12 19:45 UTC — high-signal Whop pages (trading communities / courses).
const urls = [
  'https://whop.com/discover/tradersreborn/',
  'https://whop.com/discover/premium-trading-89/cobra-trading/',
  'https://whop.com/discover/iamtrading/i-am-trading/',
  'https://whop.com/discover/tsth/',
  'https://whop.com/discover/premium-discord-atm-bot/',
  'https://whop.com/discover/premium-discord-access-eb/',
  'https://whop.com/discover/premium-discord-access-weekly/',
  'https://whop.com/discover/toritrades-premium-community/premium-discord-community/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length - 1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ? OR whop_url = ?').get(handle, u);
  if (existing) continue;

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

  inserted++;
  console.log('Inserted', handle, u);
}

console.log('Done. Inserted:', inserted);
