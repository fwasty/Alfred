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
  // Futures / options communities (high review counts)
  'https://whop.com/discover/tradingmadesimple/basic-plan-69/',
  'https://whop.com/discover/jdubtrades/discord-access-f7/',
  'https://whop.com/discover/wagyutechtrading/wagyutechfree/',
  'https://whop.com/discover/150k-express-account/fundedfuturesnetwork/',
  'https://whop.com/discover/kctrades/premium-discord-mmk/',
  'https://whop.com/discover/thetravelingtrader/premium-discord-access-5f/',
  'https://whop.com/discover/stockingsharks/options-vip-2025/',
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
