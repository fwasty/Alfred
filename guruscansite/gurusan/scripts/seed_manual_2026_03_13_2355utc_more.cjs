const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

const seeds = [
  {
    handle: 'the-resell-academy',
    name: 'The Resell Academy',
    category: 'Reselling',
    whop_url: 'https://whop.com/discover/the-resell-academy/the-resell-academy/',
  },
  {
    handle: 'premier-access-ff',
    name: 'Premier Access',
    category: 'Reselling',
    whop_url: 'https://whop.com/discover/premier-access-ff/resellroyale/',
  },
];

let inserted = 0;
let updated = 0;

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare(
      'UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), name = COALESCE(?, name), updated_at = ? WHERE handle = ?'
    ).run(s.whop_url, s.category, s.name, now(), s.handle);
    console.log('Updated', s.handle);
    updated++;
    continue;
  }

  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);
  console.log('Inserted', s.handle);
  inserted++;
}

console.log(JSON.stringify({ inserted, updated }, null, 2));
