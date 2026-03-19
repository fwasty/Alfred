const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Added (2026-03-06 EOD buildout): high-confidence Whop pages to sync.
// Notes:
// - Prefer canonical https://whop.com/<company>/ when it resolves cleanly.
// - Some companies only expose products publicly; seed a public product URL but force the handle to the company.
const seeds = [
  // Canonical company pages
  { handle: 'wealthgroup', whopUrl: 'https://whop.com/wealthgroup/' },

  // Product pages (public) but company handle is known
  { handle: 't-r-a-academy', whopUrl: 'https://whop.com/t-r-a-academy/tra-discord-access/' },
  { handle: 'smctradingpremium', whopUrl: 'https://whop.com/smctradingpremium/ict-trading-course/' },
  { handle: 'ict-all-in-one', whopUrl: 'https://whop.com/ict-all-in-one/accumulation-zone/' },

  // Discover pages (still fine for ingest)
  { handle: 'ict-ifvg-course', whopUrl: 'https://whop.com/discover/ict-ifvg-course/on-futures-trading/' },
];

let inserted = 0;
let updated = 0;

for (const s of seeds) {
  const handle = String(s.handle || '').trim().toLowerCase();
  const u = String(s.whopUrl || '').trim();
  if (!handle || !u) continue;

  const existing = db.prepare('SELECT id, whop_url FROM gurus WHERE handle = ?').get(handle);
  const ts = now();

  if (existing) {
    const nextUrl = existing.whop_url || u;
    db.prepare('UPDATE gurus SET whop_url = ?, updated_at = ? WHERE handle = ?').run(nextUrl, ts, handle);
    updated++;
    console.log('Updated', handle, '->', nextUrl);
    continue;
  }

  const id = cuid();
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
    u,
    null,
    null,
    name,
    ts,
    ts
  );

  inserted++;
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted, updated }, null, 2));
