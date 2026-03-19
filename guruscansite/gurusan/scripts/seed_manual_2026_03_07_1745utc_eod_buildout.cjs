/*
Manual seeds for Guru Scan build-out (2026-03-07 ~17:45 UTC)

Goals:
- Add a few high-confidence, popular Whop brands/offers (with confirmed public pages)
- Normalize some existing rows that still point at /discover/* instead of the canonical whop root

NOTE: This script only touches the local SQLite DB.
*/

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() {
  return crypto.randomUUID().replace(/-/g, '');
}
function now() {
  return Date.now();
}

// High-confidence seeds: confirmed via fetching https://whop.com/<handle>/ and verifying non-404.
const seeds = [
  // NEW (Trading)
  { handle: 'scarface-trades', name: 'Scarface Trades', category: 'Trading', whop_url: 'https://whop.com/scarface-trades/' },
  { handle: 'the-whale-room', name: 'The Whale Room', category: 'Trading', whop_url: 'https://whop.com/the-whale-room/' },
  { handle: 'thefrontrunners', name: 'Front Runners', category: 'Trading', whop_url: 'https://whop.com/thefrontrunners/' },
  { handle: 'robo-quant-academy', name: 'Robo Quant Academy', category: 'Trading', whop_url: 'https://whop.com/robo-quant-academy/' },
  { handle: 'hold-my-hand-wholesale', name: 'Hold My Hand Wholesale', category: 'Real Estate', whop_url: 'https://whop.com/hold-my-hand-wholesale/' },

  // NORMALIZE existing: switch /discover/* URLs to canonical root
  { handle: 'options-insider', name: 'Options Insider', category: 'Trading', whop_url: 'https://whop.com/options-insider/' },
  { handle: 'adt', name: 'American Dream Trading', category: 'Trading', whop_url: 'https://whop.com/adt/' },
  { handle: 'the-traveling-trader', name: 'The Traveling Trader', category: 'Trading', whop_url: 'https://whop.com/the-traveling-trader/' },
  { handle: 'raketrades', name: 'RakeTrades', category: 'Trading', whop_url: 'https://whop.com/raketrades/' },
];

const upsertGuru = db.prepare(`
  INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateGuru = db.prepare(`
  UPDATE gurus
  SET name = COALESCE(NULLIF(?, ''), name),
      category = COALESCE(NULLIF(?, ''), category),
      whop_url = COALESCE(NULLIF(?, ''), whop_url),
      updated_at = ?
  WHERE handle = ?
`);

const getExisting = db.prepare('SELECT id, handle, whop_url FROM gurus WHERE handle = ? LIMIT 1');

const tx = db.transaction(() => {
  for (const s of seeds) {
    const ts = now();
    const existing = getExisting.get(s.handle);

    if (existing) {
      updateGuru.run(s.name, s.category, s.whop_url, ts, s.handle);
      console.log('Updated', s.handle, '=>', s.whop_url);
      continue;
    }

    const id = cuid();
    upsertGuru.run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);
    console.log('Inserted', s.handle, '=>', s.whop_url);
  }
});

tx();
