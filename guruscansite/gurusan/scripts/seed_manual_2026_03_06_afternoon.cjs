const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manually discovered popular Whop brands (verified by URL existing).
// We intentionally prefer official Whop pages (often /discover/.../ works with our /api/whop/sync ingest).
const urls = [
  'https://whop.com/discover/atlastradinggroup/',
  'https://whop.com/discover/kaizen-trading/',
  'https://whop.com/discover/thetravelingtrader/',
  'https://whop.com/discover/wealthgroup/',
  'https://whop.com/discover/torque-trading-2-0-futures-signals/',

  // Added (2026-03-06): popular trading communities/tools with confirmed Whop pages
  'https://whop.com/discover/mtm-signals/',
  'https://whop.com/discover/top-tier-signals/',
  'https://whop.com/discover/top-tier-signals-free/',
  'https://whop.com/discover/profit-playbook-2/',
  'https://whop.com/discover/the-best-trading-journal/',
  'https://whop.com/discover/ogx-trading-bot-by-vincere/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

for (const u of urls) {
  const handle = handleFromUrl(u);
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
  console.log('Inserted', handle, u);
}
