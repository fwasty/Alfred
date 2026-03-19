const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// 2026-03-12 15:45 UTC — afternoon build-out.
// High-confidence additions (confirmed Whop pages).
const urls = [
  // Trading / signals
  'https://whop.com/discover/crypto-inside-bets/crypto-inside-bets/',
  'https://whop.com/discover/source-trading/signals-room/',
  'https://whop.com/discover/torque-trading-2-0-futures-signals/',
  'https://whop.com/discover/apextradingsignals/',
  'https://whop.com/discover/digitalcurrencytraders/proalerts/',
  'https://whop.com/discover/lune-trading-algo-signals-powered-by-ai/',
  'https://whop.com/discover/trading-signal-43/',

  // Ecommerce
  'https://whop.com/discover/1on1-ads-mastery-mentorship-ecom/ecommerce-accelerator-course/',
  'https://whop.com/discover/authentic-ecom/',
  'https://whop.com/discover/undergroundecom/',
  'https://whop.com/discover/akemi-lab/',
  'https://whop.com/discover/ecomwarriors/',
  'https://whop.com/discover/mini-ecom-mastery/',
  'https://whop.com/discover/ecomproelite/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length - 1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
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
