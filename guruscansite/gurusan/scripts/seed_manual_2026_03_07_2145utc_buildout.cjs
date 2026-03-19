/*
Manual seeds for Guru Scan build-out (2026-03-07 ~21:45 UTC)

Goals:
- Add high-confidence, popular Whop brands/offers (confirmed public pages)

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

// High-confidence seeds: verified by fetching the URLs (HTTP 200) before adding.
const seeds = [
  // Trading
  {
    handle: 'toritrades-premium-community',
    name: 'Learn to Trade Community (Tori Trades)',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/toritrades-premium-community/',
  },
  {
    handle: 'the-ones-that-know',
    name: 'The Ones That Know',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/the-ones-that-know/',
  },
  {
    handle: 'joinmomentum',
    name: 'Momentum',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/joinmomentum/',
  },
  {
    handle: 'themarketlens',
    name: 'The Market Lens',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/themarketlens/',
  },

  // Marketing / business
  {
    handle: 'goldieagency',
    name: 'The SEO Boardroom (Julian Goldie)',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/goldieagency/',
  },
  {
    handle: 'agency-domain',
    name: 'Agency Domain',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/agency-domain/',
  },
  {
    handle: 'leadbase',
    name: 'LeadBase',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/leadbase/',
  },
  {
    handle: 'internet-money',
    name: 'Internet Money',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/internet-money/',
  },
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
