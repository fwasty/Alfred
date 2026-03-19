const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// 2026-03-12 13:45 UTC — afternoon build-out.
// High-confidence additions (confirmed Whop pages).
const urls = [
  // Trading / signals
  'https://whop.com/discover/bfx-signals/',
  'https://whop.com/discover/ftg-trading/ftg-trading-signals/',
  'https://whop.com/discover/ai-signals-1/ai-signals-elite/',

  // Sports picks
  'https://whop.com/discover/lordsportspicks/lordpicks/',
  'https://whop.com/discover/weekly-vip-b1/sportsbettingdomain/',
  'https://whop.com/discover/best-bet-picks/',
  'https://whop.com/discover/coverkingspicks/freesportspicks/',
  'https://whop.com/discover/elitepickz/',

  // Ecommerce
  'https://whop.com/discover/e-commerce-builders-platinum/',
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
