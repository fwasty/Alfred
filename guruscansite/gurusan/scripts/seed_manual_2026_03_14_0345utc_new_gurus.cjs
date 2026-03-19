const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// New Whop pages confirmed via discovery.
// Note: keep this list high-confidence only (real Whop /discover pages).
const seeds = [
  {
    handle: 'adt',
    name: 'ADT',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/adt/futures-8d/',
  },
  {
    handle: 'futures-trading-factory',
    name: 'Futures Trading Factory',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/futures-trading-factory/',
  },
  {
    handle: 'real-deal-futures-free-discord',
    name: 'Real Deal Futures (Free Discord)',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/real-deal-futures-free-discord/',
  },
  {
    handle: 'market-mastery-after-midnight',
    name: 'Market Mastery (After Midnight)',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/market-mastery-after-midnight/aftermidnight/',
  },
  {
    handle: 'trading-secrets-elite',
    name: 'Trading Secrets Elite',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/trading-secrets-elite/tradingsecretsdiscord/',
  },
  {
    handle: 'argus-ai-automation-academy',
    name: 'AI Automation Academy',
    category: 'AI',
    whop_url: 'https://whop.com/discover/argus-ai-automation-academy/',
  },
  {
    handle: 'ai-master-me',
    name: 'AI Master Me',
    category: 'AI',
    whop_url: 'https://whop.com/discover/ai-master-me/ai-master-pro-lifetime/',
  },
  {
    handle: 'modelforge',
    name: 'ModelForge',
    category: 'AI',
    whop_url: 'https://whop.com/discover/modelforge/',
  },
  {
    handle: 'inner-circle-by-ddm',
    name: 'Inner Circle By DDM',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/inner-circle-by-ddm/digital-dropshipping-mastery/',
  },
  {
    handle: 'vip-access-7d',
    name: 'VIP Access',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/vip-access-7d/ecomwarts-school-of-entrepreneurship/',
  },
];

let inserted = 0;
let updated = 0;

const upsert = db.transaction(() => {
  for (const s of seeds) {
    const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
    if (existing) {
      db.prepare(
        'UPDATE gurus SET name = COALESCE(?, name), whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), updated_at = ? WHERE handle = ?'
      ).run(s.name, s.whop_url, s.category, now(), s.handle);
      console.log('Updated', s.handle);
      updated++;
      continue;
    }

    const id = cuid();
    const ts = now();
    db.prepare(
      `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);
    console.log('Inserted', s.handle, '->', s.whop_url);
    inserted++;
  }
});

upsert();
console.log(JSON.stringify({ inserted, updated }, null, 2));
