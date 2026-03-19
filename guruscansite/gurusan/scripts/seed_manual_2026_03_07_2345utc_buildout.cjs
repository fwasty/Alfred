/*
Manual seeds for Guru Scan build-out (2026-03-07 ~23:45 UTC)

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
    handle: 'community-traders-com',
    name: 'Community Traders',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/community-traders-com/',
  },
  {
    handle: 'the-underground-trading-community',
    name: 'The Underground Trading Community',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/the-underground-trading-community/',
  },
  {
    handle: 'stocktalk',
    name: 'Stock Talk Insiders',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/stocktalk/',
  },
  {
    handle: 'tactical-traders',
    name: 'Tactical Traders',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/tactical-traders/',
  },
  {
    handle: 'marketedge',
    name: 'MarketEdge AI',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/marketedge/',
  },

  // Marketing / AI
  {
    handle: 'ai-revolution',
    name: 'AI Revolution',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/ai-revolution/',
  },
  {
    handle: 'aistorebuilder',
    name: 'AI Store Builder',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/aistorebuilder/',
  },

  // Reselling
  {
    handle: 'house-of-resell',
    name: 'House of Resell',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/house-of-resell/',
  },
  {
    handle: 'reselling-secrets',
    name: 'Reselling Secrets',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/reselling-secrets/',
  },
  {
    handle: 'resellers-paradise',
    name: "Reseller's Paradise",
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/resellers-paradise/',
  },
  {
    handle: 'thecollective',
    name: 'The Collective',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/thecollective/',
  },
  {
    handle: 'alistreselling',
    name: 'A-List Reselling',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/alistreselling/',
  },

  // Sports betting
  {
    handle: 'mysportpick',
    name: 'MySportPick',
    category: 'Sports Betting',
    whop_url: 'https://whop.com/marketplace/mysportpick/',
  },
  {
    handle: 'profitic-sports',
    name: 'Profitic Sports Bets',
    category: 'Sports Betting',
    whop_url: 'https://whop.com/marketplace/profitic-sports/',
  },
  {
    handle: 'umbrellasports',
    name: 'Umbrella Sports Picks',
    category: 'Sports Betting',
    whop_url: 'https://whop.com/marketplace/umbrellasports/',
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
