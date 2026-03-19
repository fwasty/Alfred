const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Added (2026-03-07 03:45 UTC): conservative Whop /discover finds across trading/reselling/ecom/AI.
// Goal: seed new brands with confirmed Whop pages, then run /api/whop/sync to ingest offers + socials.
const urls = [
  // Trading / markets
  'https://whop.com/discover/masterdaytrading-discord-trading-room/',
  'https://whop.com/discover/topfloortrading1/',
  'https://whop.com/discover/free-access-87/laductrading/',
  'https://whop.com/discover/forexuniversity/',
  'https://whop.com/discover/global-trade-empire-vip-forex-signals/',

  // Reselling / cook groups
  'https://whop.com/discover/cookgroup/',
  'https://whop.com/discover/paragn-network/',
  'https://whop.com/discover/free-community-f4-ce67/',

  // Ecom / marketing
  'https://whop.com/discover/proper-ecom-academy-lite/',
  'https://whop.com/discover/1on1-ads-mastery-mentorship-ecom/ecommerce-accelerator-course/',
  'https://whop.com/discover/scalewithsteven/',

  // Tools / automation
  'https://whop.com/discover/alertsify/',

  // AI communities
  'https://whop.com/discover/awa/',
  'https://whop.com/discover/argus-ai-automation-academy/ai-automation-community/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

let inserted = 0;
const insertedHandles = [];
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
  insertedHandles.push(handle);
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted, insertedHandles }, null, 2));
