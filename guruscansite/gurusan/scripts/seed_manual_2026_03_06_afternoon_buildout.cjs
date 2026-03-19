const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Added (2026-03-06 afternoon buildout): popular trading communities/tools with confirmed Whop /discover pages.
// Goal: seed new brands, then run /api/whop/sync to ingest offers + socials.
const urls = [
  'https://whop.com/discover/capitalcomplex/',
  'https://whop.com/discover/traderade/traderade-free-trading-community/',
  'https://whop.com/discover/thelabtrading/',
  'https://whop.com/discover/trend-s-trading-room-ict/',
  'https://whop.com/discover/the-traders-blueprint/',
  'https://whop.com/discover/trading-louis-course-premium-access-lifetime/tradinglouis/',
  'https://whop.com/discover/the-trading-club-premium/the-trading-club-free-discord/',
  'https://whop.com/discover/kdb-private-club/',

  // Added (2026-03-06 afternoon buildout, v2)
  'https://whop.com/discover/uris-trading/discord-trading-room/',
  'https://whop.com/discover/futures-trading-factory/',
  'https://whop.com/discover/market-masters-discord/market-masters-emc/',
  'https://whop.com/discover/futuresculture/',
  'https://whop.com/discover/discord-access-c6/',
  'https://whop.com/discover/masterdaytrading-discord-trading-room/',

  'https://whop.com/discover/the-soup-room/',
  'https://whop.com/discover/ict-prodigy/',
  'https://whop.com/discover/ictkesik/',
  'https://whop.com/discover/free-community-a4-0dc4/',
  'https://whop.com/discover/dhesitrades/dhesi-capital/',
  'https://whop.com/discover/ictkraken/',

  'https://whop.com/discover/peaktraders/',
  'https://whop.com/discover/theeurotrader/',
  'https://whop.com/discover/the-simple-trader-blueprint/the-simple-traders/',
  'https://whop.com/discover/kjbookclub/how-to-beat-prop-firms/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
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

console.log(JSON.stringify({ inserted }, null, 2));
