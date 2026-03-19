const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Goal: add high-confidence brands/communities, then sync via /api/whop/sync.
const urls = [
  // Futures / trading / signals
  'https://whop.com/discover/dhesitrades/lifetime-membership-40/',
  'https://whop.com/discover/premium-discord-3-month-membership/surgetrading/',
  'https://whop.com/discover/source-trading/signals-room/',
  'https://whop.com/discover/premarket-plus-program/datadriven-trading/',
  'https://whop.com/discover/trustedsignals/trusted-signals/',
  'https://whop.com/discover/tradebuddy/trade-buddy-trade-signals/',
  'https://whop.com/discover/tradevisor/tradevisor/',
  'https://whop.com/discover/eliteclouds-trading-education/eliteclouds-trading-education/',

  // Crypto
  'https://whop.com/discover/crypto-inside-bets/crypto-inside-bets/',

  // Marketplace (will normalize to canonical via og:url during sync)
  'https://whop.com/marketplace/lade-backk-trading/',
];

function handleFromWhopUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const url = new URL(clean);
  const parts = url.pathname.split('/').filter(Boolean);

  // /discover/<company>/<offer>
  if (parts[0] === 'discover' && parts[1]) return parts[1].toLowerCase();

  // /marketplace/<company>
  if (parts[0] === 'marketplace' && parts[1]) return parts[1].toLowerCase();

  // /joined/<company>
  if (parts[0] === 'joined' && parts[1]) return parts[1].toLowerCase();

  // /<company>/...
  return (parts[0] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromWhopUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    console.log('Skip existing', handle);
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
    'Whop',
    null,
    u,
    null,
    null,
    name,
    ts,
    ts
  );

  inserted++;
  console.log('Inserted', handle, u);
}

console.log(`Done. Inserted ${inserted} new gurus.`);
