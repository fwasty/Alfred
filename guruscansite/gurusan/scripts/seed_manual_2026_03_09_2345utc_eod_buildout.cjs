const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manual buildout (2026-03-09 ~23:45 UTC)
// Seed high-confidence brands/communities with confirmed company-level Whop pages.
// Verified via HTTP 200 on https://whop.com/<handle>/ before adding.
const items = [
  // Discovered via Whop marketplace / indexed pages
  { handle: 'datatrader', whop_url: 'https://whop.com/datatrader/', category: 'Trading' },
  { handle: 'vanquish-holdings', whop_url: 'https://whop.com/vanquish-holdings/', category: 'Trading' },
  { handle: 'premium-rsa-callouts', whop_url: 'https://whop.com/premium-rsa-callouts/', category: 'Trading' },
  { handle: '1-to-1-mentoring', whop_url: 'https://whop.com/1-to-1-mentoring/', category: 'Trading' },
  { handle: 'tradingarena', whop_url: 'https://whop.com/tradingarena/', category: 'Trading' },
  { handle: 'collective-investing', whop_url: 'https://whop.com/collective-investing/', category: 'Trading' },
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
