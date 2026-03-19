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

const seeds = [
  { handle: 'tjr-indicators-bundle', name: 'TJR Indicators Bundle', category: 'Trading', whop_url: 'https://whop.com/tjr-indicators-bundle/' },
  { handle: 'pbtrading', name: 'PB Trading', category: 'Trading', whop_url: 'https://whop.com/pbtrading/' },
  { handle: 'brez-marketing', name: 'Brez Marketing', category: 'Marketing', whop_url: 'https://whop.com/brez-marketing/' },
  { handle: 'stock-paper-scissors', name: 'Stock Paper Scissors', category: 'Trading', whop_url: 'https://whop.com/stock-paper-scissors/' },
  { handle: 'bonkau', name: 'The Ryze Network', category: 'Trading', whop_url: 'https://whop.com/bonkau/' },
];

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare('UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), updated_at = ? WHERE handle = ?')
      .run(s.whop_url, s.category, now(), s.handle);
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
