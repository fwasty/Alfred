const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manual discoveries (high confidence Whop pages; focus = popular courses/brands).
// Source: targeted web search (keep conservative; skip low-confidence).
const urls = [
  // Trading
  'https://whop.com/discover/free-discord-fc/',
  'https://whop.com/discover/the-trading-club-premium/the-trading-club-free-discord/',
  'https://whop.com/discover/discord-vip-access-f4/',
  'https://whop.com/discover/codecandlesvip2/discordcodeandcandle/',

  // AI / automation / creator community
  'https://whop.com/discover/argus-ai-automation-academy/',
  'https://whop.com/discover/ai-insiders1/',
  'https://whop.com/discover/ai-hub-for-creators/',
  'https://whop.com/discover/vision-reimagine/vision-reimagine/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/, '');
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
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g, ' '), handle, 'Whop', null, u, null, ts, ts);
  inserted++;
  console.log('Inserted', handle, u);
}

console.log('Done. Inserted:', inserted);
