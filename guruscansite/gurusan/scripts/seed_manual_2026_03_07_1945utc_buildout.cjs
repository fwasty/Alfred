/*
Manual seeds for Guru Scan build-out (2026-03-07 ~19:45 UTC)

Goals:
- Add a handful of high-confidence, popular Whop brands/offers (with confirmed public pages)

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

// High-confidence seeds: confirmed via fetching https://whop.com/<route>/ and verifying non-404.
const seeds = [
  // Trading
  { handle: 'moon-market', name: 'Moon Market', category: 'Trading', whop_url: 'https://whop.com/moon-market/' },
  { handle: 'jv-trading-ebook', name: 'JV Trading', category: 'Trading', whop_url: 'https://whop.com/jv-trading-ebook/' },
  { handle: 'oculus-trading-vip-weekly', name: 'Oculus Trading', category: 'Trading', whop_url: 'https://whop.com/oculus-trading-vip-weekly/' },
  { handle: 'stockdads', name: 'Stock Dads', category: 'Trading', whop_url: 'https://whop.com/stockdads/' },

  // Marketing / business
  { handle: 'agency-insiders-pro', name: 'Agency Insiders', category: 'Marketing', whop_url: 'https://whop.com/agency-insiders-pro/' },
  { handle: 'aiautomationagency', name: 'AI Automation Agency', category: 'Marketing', whop_url: 'https://whop.com/aiautomationagency/' },
];

const insertGuru = db.prepare(`
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

let inserted = 0;
let updated = 0;

const tx = db.transaction(() => {
  for (const s of seeds) {
    const ts = now();
    const existing = getExisting.get(s.handle);

    if (existing) {
      updateGuru.run(s.name, s.category, s.whop_url, ts, s.handle);
      updated++;
      console.log('Updated', s.handle, '=>', s.whop_url);
      continue;
    }

    const id = cuid();
    insertGuru.run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);
    inserted++;
    console.log('Inserted', s.handle, '=>', s.whop_url);
  }
});

tx();
console.log(JSON.stringify({ inserted, updated, total: seeds.length }));
