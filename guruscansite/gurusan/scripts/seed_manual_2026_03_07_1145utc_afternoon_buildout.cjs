const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manual discoveries (high confidence Whop pages; focus = popular courses/brands).
// Source: targeted web search (conservative; skip low-confidence / auth-gated pages).
const urls = [
  'https://whop.com/discover/stock-moe/stock-moe-learner/',
  'https://whop.com/discover/trim-trading-monthly/trim-trading/',
  'https://whop.com/discover/romeo-trades-premium-discord/romeo-trades/',
  'https://whop.com/discover/topfloortrading1/private-discord-access-limited-spots/',
  'https://whop.com/discover/premium-discord-access-monthly-c2/swushtrading/',
  'https://whop.com/discover/elitetradersvip/elitetradersfree/',
  'https://whop.com/discover/raidentrading/raidentrading/',
  'https://whop.com/discover/primetime-trading-group/',
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
