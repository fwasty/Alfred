const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-12 ~03:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Keep to high-confidence brands/communities with real Whop pages.
const items = [
  // Sports betting
  { handle: 'break-the-odds-free-member', url: 'https://whop.com/discover/break-the-odds-free-member/breaktheboox/', category: 'Sports Betting' },

  // Trading
  { handle: 'monsterlab', url: 'https://whop.com/discover/monsterlab/free-community-ba-f3d5/', category: 'Trading' },
  { handle: 'limitless', url: 'https://whop.com/discover/limitless/the-market-maker/', category: 'Trading' },

  // Reselling / cook group
  { handle: 'beastsden', url: 'https://whop.com/discover/cookbeast-monthly-members/beastsden/', category: 'Reselling' },

  // Clipping
  // NOTE: this one redirects to /joined/ when accessed via /discover/; keep as-is for now.
  { handle: 'clip-farm-official', url: 'https://whop.com/joined/clip-farm-official/', category: 'Clipping' },
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
