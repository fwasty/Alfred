const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-11 ~19:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Only add high-confidence brands/communities with real Whop pages.
const items = [
  // Trading
  { handle: 'prestigetradingdiscord', url: 'https://whop.com/discover/prestigetradingdiscord/profitability-partner-program/', category: 'Trading' },
  { handle: 'discord-member-no-1on1', url: 'https://whop.com/discover/discord-member-no-1on1/aval-trading-path-to-profit/', category: 'Trading' },

  // Clipping / content rewards
  { handle: 'clipixx', url: 'https://whop.com/discover/clipixx/clipixx/', category: 'Clipping' },
  { handle: 'paid-in-clips-premium', url: 'https://whop.com/discover/paid-in-clips-premium/crypto-inclips/', category: 'Clipping' },
  { handle: 'clipflow-bootcamp', url: 'https://whop.com/discover/clipflow-bootcamp/clips/', category: 'Clipping' },
  { handle: 'clip-labs-bootcamp', url: 'https://whop.com/discover/clip-labs-bootcamp/clip-labs/', category: 'Clipping' },
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
