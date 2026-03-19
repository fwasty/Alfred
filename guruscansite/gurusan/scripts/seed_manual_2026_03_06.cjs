const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manually discovered popular Whop brands (verified by URL existing).
// NOTE: handle is our local slug; whop_url is the public Whop page used by /api/whop/sync.
const items = [
  { handle: 'asfx', whop_url: 'https://whop.com/asfx/' },
  { handle: 'hit-trading', whop_url: 'https://whop.com/hit-trading/' },
  { handle: 'phantomtrading', whop_url: 'https://whop.com/ptmtrading/phantomtrading/' },
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
