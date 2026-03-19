/*
Manual seeds for Guru Scan build-out (2026-03-08 ~01:45 UTC)

Goals:
- Add high-confidence, popular Whop brands/offers (confirmed public marketplace pages)

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

// High-confidence seeds: URLs were checked (HTTP 200) before adding.
const seeds = [
  // Trading
  {
    handle: 'stockvip',
    name: 'Stock VIP',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/stockvip/',
  },
  {
    handle: 'simplified-trading',
    name: 'Kris Trades',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/simplified-trading/',
  },
  {
    handle: 'jv-trading',
    name: 'JV Trading',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/jv-trading/',
  },
  {
    handle: 'stock-moe-academy',
    name: 'Stock Moe Academy',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/stock-moe-academy/',
  },
  {
    handle: 'the-atmosphere',
    name: 'The Atmosphere Trading',
    category: 'Trading',
    whop_url: 'https://whop.com/marketplace/the-atmosphere/',
  },

  // Reselling
  {
    handle: 'direct-resell',
    name: 'Direct Resell',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/direct-resell/',
  },
  {
    handle: 'tbu-pro',
    name: 'Ticket Broker U',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/tbu-pro/',
  },
  {
    handle: 'resell-gods',
    name: 'Resell Gods',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/resell-gods/',
  },
  {
    handle: 'let-s-cook-aio',
    name: "Let's Cook AIO",
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/let-s-cook-aio/',
  },
  {
    handle: 'reselluniversity',
    name: 'Resell University',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/reselluniversity/',
  },
  {
    handle: 'signup-lowkey-discord',
    name: 'Lowkey Discord',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/signup-lowkey-discord/',
  },
  {
    handle: 'solesource',
    name: 'Sole Source',
    category: 'Reselling',
    whop_url: 'https://whop.com/marketplace/solesource/',
  },

  // Marketing / Business
  {
    handle: 'ai-businessplans',
    name: 'AI BusinessPlans',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/ai-businessplans/',
  },
  {
    handle: 'mastermind',
    name: 'The Mastermind',
    category: 'Marketing',
    whop_url: 'https://whop.com/marketplace/mastermind/',
  },

  // Sports Betting
  {
    handle: 'btsdiscord',
    name: 'Beat the Sportsbooks',
    category: 'Sports Betting',
    whop_url: 'https://whop.com/marketplace/btsdiscord/',
  },
  {
    handle: 'securedpicks',
    name: 'SecuredPicks',
    category: 'Sports Betting',
    whop_url: 'https://whop.com/marketplace/securedpicks/',
  },
  {
    handle: 'filthyfive-discord-1',
    name: 'FilthyFive',
    category: 'Sports Betting',
    whop_url: 'https://whop.com/marketplace/filthyfive-discord-1/',
  },
  {
    handle: 'playerodds',
    name: 'PlayerOdds',
    category: 'Sports Betting',
    whop_url: 'https://whop.com/marketplace/playerodds/',
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
