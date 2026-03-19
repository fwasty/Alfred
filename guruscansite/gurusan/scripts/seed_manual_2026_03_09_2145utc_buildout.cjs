const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manual buildout (2026-03-09 ~21:45 UTC)
// Seed high-confidence brands/communities with confirmed *company-level* Whop pages.
// Verified via HTTP 200 on https://whop.com/<handle>/ before adding.
const items = [
  { handle: 'oculus-trading', whop_url: 'https://whop.com/oculus-trading/', category: 'Trading' },
  { handle: 'free-discord-c3', whop_url: 'https://whop.com/free-discord-c3/', category: 'Trading' },

  // From Whop Forex Discord list (blog)
  { handle: 'derivatives-trading', whop_url: 'https://whop.com/derivatives-trading/', category: 'Trading' },
  { handle: 'forex-and-futures-trading-course', whop_url: 'https://whop.com/forex-and-futures-trading-course/', category: 'Trading' },
];

const insert = db.prepare(
  `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let inserted = 0;
for (const it of items) {
  const handle = String(it.handle || '').trim().toLowerCase();
  if (!handle) continue;
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) continue;

  const id = cuid();
  const ts = now();
  insert.run(
    id,
    handle.replace(/-/g, ' '),
    handle,
    it.category || 'Whop',
    null,
    it.whop_url,
    null,
    ts,
    ts
  );

  inserted++;
  console.log('Inserted', handle, it.whop_url);
}

console.log('Done. New gurus inserted:', inserted);
