const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manually discovered popular Whop brands (verified by URL existing).
const items = [
  { handle: 'tempotrades', whop_url: 'https://whop.com/tempotrades/' },
  { handle: 'iso-trading', whop_url: 'https://whop.com/iso-trading/' },
  { handle: 'tactical-traders', whop_url: 'https://whop.com/tactical-traders/' },
  { handle: 'kctrades', whop_url: 'https://whop.com/kctrades/' },
  { handle: 'trim-trading-monthly', whop_url: 'https://whop.com/trim-trading-monthly/' },
  { handle: 'databasedbets', whop_url: 'https://whop.com/databasedbets/' },
  { handle: 'mtm-live-trading-room', whop_url: 'https://whop.com/mtm-live-trading-room/' },
];

for (const it of items) {
  const handle = it.handle.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
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
    it.whop_url,
    null,
    null,
    name,
    ts,
    ts
  );
  console.log('Inserted', handle, it.whop_url);
}
