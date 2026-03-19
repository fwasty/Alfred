const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-12 ~09:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Keep to high-confidence brands/communities with real Whop pages.
const items = [
  // Trading (Futures / Options)
  { handle: 'home-of-rta', url: 'https://whop.com/discover/home-of-rta/futures-trading-4e/', category: 'Trading' },
  { handle: 'adt', url: 'https://whop.com/discover/adt/futures-8d/', category: 'Trading' },
  { handle: 'investingerb', url: 'https://whop.com/discover/investingerb/futurespackage/', category: 'Trading' },
  { handle: 'tradewithinsight', url: 'https://whop.com/discover/tradewithinsight/trade-with-insight-futures/', category: 'Trading' },
  { handle: 'real-deal-futures-free-discord', url: 'https://whop.com/discover/real-deal-futures-free-discord/', category: 'Trading' },
  { handle: 'trading-secrets-elite', url: 'https://whop.com/discover/trading-secrets-elite/tradingsecretsdiscord/', category: 'Trading' },
  { handle: 'futures-trading-factory', url: 'https://whop.com/discover/futures-trading-factory/', category: 'Trading' },
  { handle: 'jdubtrades', url: 'https://whop.com/discover/jdubtrades/discord-access-f7/', category: 'Trading' },
  { handle: 'market-mastery-after-midnight', url: 'https://whop.com/discover/market-mastery-after-midnight/aftermidnight/', category: 'Trading' },
  { handle: 'jff-premium', url: 'https://whop.com/discover/jff-premium/', category: 'Trading' },

  // Agency / SMMA
  { handle: 'agency-domain', url: 'https://whop.com/discover/agency-domain/asl/', category: 'Agency' },
  { handle: 'agency-insiders-pro', url: 'https://whop.com/discover/agency-insiders-pro/agency-insiders/', category: 'Agency' },
  { handle: 'agencysecrets-73', url: 'https://whop.com/discover/agencysecrets-73/agencysecrets/', category: 'Agency' },

  // Crypto / Misc online money
  { handle: 'wealthgroup', url: 'https://whop.com/discover/wealthgroup/', category: 'Crypto' },
  { handle: 'product-reviews', url: 'https://whop.com/discover/product-reviews/', category: 'UGC' },
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
