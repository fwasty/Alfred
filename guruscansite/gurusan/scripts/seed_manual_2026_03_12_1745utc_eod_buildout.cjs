const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// 2026-03-12 17:45 UTC — EOD build-out.
// High-confidence additions (confirmed Whop pages via site:whop.com/discover searches).
const urls = [
  // Trading
  'https://whop.com/discover/futures-options-signals/',
  'https://whop.com/discover/tactical-futures/',
  'https://whop.com/discover/optionstrader99/',

  // Ecommerce / marketing
  'https://whop.com/discover/ecommercemastery1on1/',
  'https://whop.com/discover/creative-that-converts/',

  // Agency
  'https://whop.com/discover/aiagencymastermind/',
  'https://whop.com/discover/mastermind-ca/',
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
