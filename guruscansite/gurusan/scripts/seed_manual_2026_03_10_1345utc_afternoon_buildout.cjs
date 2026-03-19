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

// Manual seed adds for 2026-03-10 13:45 UTC (afternoon build-out)
// High-confidence Whop company pages where root /<slug>/ resolves to /joined/<slug>/.
const seeds = [
  { handle: 'themarketlens', name: 'The Market Lens', category: 'Trading', whop_url: 'https://whop.com/themarketlens/' },
  { handle: 'navigationtrading', name: 'Navigation Trading', category: 'Trading', whop_url: 'https://whop.com/navigationtrading/' },
  { handle: 'win-capital-llc', name: 'WIN Capital LLC', category: 'Trading', whop_url: 'https://whop.com/win-capital-llc/' },
  { handle: 'toolpack', name: 'Tool Pack', category: 'Ecom', whop_url: 'https://whop.com/toolpack/' },
  { handle: 'house-of-resell', name: 'House of Resell', category: 'Reselling', whop_url: 'https://whop.com/house-of-resell/' },
  { handle: 'lockeroom-picks', name: 'Lockeroom Picks', category: 'Sports Betting', whop_url: 'https://whop.com/lockeroom-picks/' },
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
