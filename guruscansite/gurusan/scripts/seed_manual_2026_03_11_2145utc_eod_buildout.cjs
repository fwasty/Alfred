const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-11 ~21:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Only add high-confidence brands/communities with real Whop pages.
const items = [
  // Trading
  { handle: 'jdubtrades', url: 'https://whop.com/discover/jdubtrades/discord-access-f7/', category: 'Trading' },
  { handle: 'market-masters-discord', url: 'https://whop.com/discover/market-masters-discord/market-masters-emc/', category: 'Trading' },
  { handle: 'wagyutechtrading', url: 'https://whop.com/discover/wagyutechtrading/wagyutechfree/', category: 'Trading' },
  { handle: 'elite-futures-traders-discord', url: 'https://whop.com/discover/elite-futures-traders-discord/', category: 'Trading' },
  { handle: '150k-express-account', url: 'https://whop.com/discover/150k-express-account/fundedfuturesnetwork/', category: 'Trading' },

  // Clipping / content rewards
  { handle: 'cash-legends', url: 'https://whop.com/discover/cash-legends/legends-clips/', category: 'Clipping' },
  { handle: 'clip-smart', url: 'https://whop.com/discover/clip-smart/clip-smart/', category: 'Clipping' },
  { handle: 'clipedge', url: 'https://whop.com/discover/clipedge/clip-edge/', category: 'Clipping' },
  { handle: 'graziosi-clips', url: 'https://whop.com/discover/graziosi-clips/', category: 'Clipping' },
  { handle: 'clip-ceo-gage', url: 'https://whop.com/discover/clip-ceo-gage/', category: 'Clipping' },
  { handle: 'yourfirstdollar', url: 'https://whop.com/discover/yourfirstdollar/rob-clips/', category: 'Clipping' },
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
