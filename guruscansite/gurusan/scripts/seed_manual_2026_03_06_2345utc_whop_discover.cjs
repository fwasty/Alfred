const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Discovered via conservative web_search (Whop discover pages).
const urls = [
  'https://whop.com/discover/28club/28clubsignals/',
  'https://whop.com/discover/thm-vip-membership/',
  'https://whop.com/discover/market-signals-x/',
  'https://whop.com/discover/propwave/propwave-free/',
  'https://whop.com/discover/daytradinggps/day-trading-levels-discord/',
  'https://whop.com/discover/thetravelingtrader/premium-discord-access-1f/',
  'https://whop.com/discover/ground-zero-alpha/ground-zero-free-discord/',
  'https://whop.com/discover/l-a-m-club/',
  'https://whop.com/discover/supremeecom/',
  'https://whop.com/discover/dropshipping-den/',
  'https://whop.com/discover/dropship-journey-2-0/join-link/',
  'https://whop.com/discover/clipping-cashs/clips-to-clipx/',
  'https://whop.com/discover/kingcapsports/kingcap-clips-1/',
  'https://whop.com/discover/eleven-labs/eleven-labs-df/',
  'https://whop.com/discover/ben-bader-clips/ben-bader-clips-02/',
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
  if (existing) {
    console.log('Skip (exists)', handle);
    continue;
  }

  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    handle.replace(/-/g, ' '),
    handle,
    'Whop',
    null,
    u,
    null,
    ts,
    ts
  );

  inserted++;
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted, total_urls: urls.length }));
