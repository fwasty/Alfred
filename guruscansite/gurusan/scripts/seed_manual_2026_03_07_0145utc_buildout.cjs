const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Added (2026-03-07 01:45 UTC): Whop /discover pages discovered via conservative web search.
// Goal: seed new brands with confirmed Whop pages, then run /api/whop/sync to ingest offers + socials.
const urls = [
  // Trading communities (search: "site:whop.com/discover trading discord room")
  'https://whop.com/discover/storytrading-discord/',
  'https://whop.com/discover/the-boiler-room-vip/',
  'https://whop.com/discover/mtm-live-trading-room/mtm-vip-discord-crypto/',
  'https://whop.com/discover/axis-trading-lifetime-full-access/axis-trading/',
  'https://whop.com/discover/1-to-1-mentoring/vanquish-trading-room/',
  'https://whop.com/discover/traders-connect-discord/',
  'https://whop.com/discover/trading-discord-access/',

  // Options/futures rooms (search: "site:whop.com/discover options trading room whop")
  'https://whop.com/discover/the-champagne-room/',
  'https://whop.com/discover/vip-lifetime-38/prosperatrading/',
  'https://whop.com/discover/s7f-live-trading-room/',
  'https://whop.com/discover/the-options-exchange/',
  'https://whop.com/discover/the-trading-room-e6/',
  'https://whop.com/discover/futures-options-signals/',
  'https://whop.com/discover/max-options-trading/maxstermind-futures/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ? OR whop_url = ?').get(handle, u);
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
  inserted++;
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted }, null, 2));
