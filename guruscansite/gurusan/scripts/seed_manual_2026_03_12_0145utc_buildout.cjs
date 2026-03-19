const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-12 ~01:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Keep to high-confidence brands/communities with real Whop pages.
const items = [
  // Reselling / collecting
  { handle: 'flipflip-lifetime-pass', url: 'https://whop.com/discover/flipflip/lifetimemembership/', category: 'Reselling' },
  { handle: '99vinyl', url: 'https://whop.com/discover/99vinyl/99vinyl/', category: 'Reselling' },

  // AI tools
  { handle: 'wava-ai', url: 'https://whop.com/discover/wava-ai/wava-ai/', category: 'Tools' },

  // Clipping
  { handle: 'clippy-clipping-course', url: 'https://whop.com/discover/clippy/gorgi/', category: 'Clipping' },

  // Sports betting
  { handle: 'rt-picks', url: 'https://whop.com/discover/rt-picks/rt-picks-free/', category: 'Sports Betting' },
];

let inserted = 0;
let skipped = 0;
const insertedHandles = [];

for (const it of items) {
  const handle = (it.handle || '').toLowerCase().trim();
  if (!handle) continue;

  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    skipped++;
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
    it.category || 'Whop',
    null,
    it.url,
    null,
    null,
    name,
    ts,
    ts
  );

  inserted++;
  insertedHandles.push(handle);
  console.log('Inserted', handle, it.url);
}

console.log(JSON.stringify({ inserted, skipped, insertedHandles }, null, 2));
