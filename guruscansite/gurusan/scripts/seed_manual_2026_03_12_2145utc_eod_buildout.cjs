const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// 2026-03-12 21:45 UTC — discovered via conservative web_search (confirmed Whop discover pages).
// Goal: add high-signal trading/mentorship brands for follow-up sync via /api/whop/sync.
const urls = [
  'https://whop.com/discover/free-discord-fc/',
  'https://whop.com/discover/tactical-traders/',
  'https://whop.com/discover/discord-vip-access-f4/',
  'https://whop.com/discover/trlstrading/',
  'https://whop.com/discover/trim-trading-monthly/trim-trading/',
  'https://whop.com/discover/codecandlesvip2/discordcodeandcandle/',
  'https://whop.com/discover/real-deal-futures-free-discord/',
  'https://whop.com/discover/thepathmentorship/mxtmentorship/',
  'https://whop.com/discover/traders-compound-e5/vip-traders-compound/',
  'https://whop.com/discover/masterthemarket/mastering-market-mentorships/',
  'https://whop.com/discover/trading-university-ac/emmanueltradesmentorship/',
  'https://whop.com/discover/cbprofits/2-on-1-mentorship/',
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
