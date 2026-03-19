const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manual EOD buildout (2026-03-09 17:45 UTC)
// NOTE: /api/whop/sync expects *company* URLs (e.g. https://whop.com/<route>/), not /discover/ product pages.
const items = [
  { handle: 'premarket-plus-program', whop_url: 'https://whop.com/premarket-plus-program/' },
  { handle: 'premium-trading-89', whop_url: 'https://whop.com/premium-trading-89/' },
  { handle: 'ptmtrading', whop_url: 'https://whop.com/ptmtrading/' },
  { handle: 'wealthview-trading', whop_url: 'https://whop.com/wealthview-trading/' },
  { handle: 'rb-trading', whop_url: 'https://whop.com/rb-trading/' },

  { handle: 'realcreatorflow', whop_url: 'https://whop.com/realcreatorflow/' },
  { handle: 'dispatch-standard', whop_url: 'https://whop.com/dispatch-standard/' },
  { handle: 'endurance', whop_url: 'https://whop.com/endurance/' },
  { handle: 'steven', whop_url: 'https://whop.com/steven/' },

  { handle: 'odds-matter', whop_url: 'https://whop.com/odds-matter/' },
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
    'Whop',
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
