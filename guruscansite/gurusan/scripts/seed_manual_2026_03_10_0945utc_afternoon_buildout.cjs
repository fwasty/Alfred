const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() {
  return crypto.randomUUID().replace(/-/g, '');
}
function now() {
  return Date.now();
}

// Manual seed adds for 2026-03-10 09:45 UTC (afternoon build-out)
// Only include high-confidence Whop company pages (root /<slug>/ that resolves to /joined/<slug>/).
const seeds = [
  { handle: 'ds-futures-trading', name: 'DS Futures Trading', category: 'Trading', whop_url: 'https://whop.com/ds-futures-trading/' },
  { handle: 'tradelink-exclusive-trading-community', name: 'TradeLink: Exclusive Trading Community', category: 'Trading', whop_url: 'https://whop.com/tradelink-exclusive-trading-community/' },
  { handle: 'tigerlinetrading', name: 'Tiger Line Trading', category: 'Trading', whop_url: 'https://whop.com/tigerlinetrading/' },
  { handle: 'ptmtrading', name: 'Phantom Trading', category: 'Trading', whop_url: 'https://whop.com/ptmtrading/' },
];

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare(
      'UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), name = COALESCE(?, name), updated_at = ? WHERE handle = ?'
    ).run(s.whop_url, s.category, s.name, now(), s.handle);
    console.log('Updated', s.handle);
    continue;
  }
  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);
  console.log('Inserted', s.handle);
}
