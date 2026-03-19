const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Conservative, confirmed Whop marketplace pages.
// Note: handle is derived from the route; we store the marketplace URL as the seed whop_url.
const seeds = [
  { handle: 'theryzenetwork', whop_url: 'https://whop.com/marketplace/theryzenetwork/', name: 'The Ryze Network' },
  { handle: 'dodgy-s-dungeon', whop_url: 'https://whop.com/marketplace/dodgy-s-dungeon/', name: "Dodgy's Dungeon" },
  { handle: 'traders-paradise', whop_url: 'https://whop.com/marketplace/traders-paradise/', name: 'Traders Paradise' },
  { handle: 'consistency-capital', whop_url: 'https://whop.com/marketplace/consistency-capital/', name: 'Consistency Capital' },
  { handle: 'short-trading-101', whop_url: 'https://whop.com/marketplace/short-trading-101/', name: 'The Short Trader 101' },
];

const insert = db.prepare(
  `INSERT INTO gurus (
    id, name, handle, category, bio, whop_url, whop_synced_at,
    creator_name, brand_name,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let inserted = 0;
for (const s of seeds) {
  const handle = String(s.handle).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) continue;
  const id = cuid();
  const ts = now();
  insert.run(
    id,
    s.name || handle.replace(/-/g, ' '),
    handle,
    'Whop',
    null,
    s.whop_url,
    null,
    null,
    s.name || handle.replace(/-/g, ' '),
    ts,
    ts
  );
  inserted++;
  console.log('Inserted', handle, s.whop_url);
}

console.log('Done. Inserted:', inserted);
