const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Conservative, confirmed Whop marketplace pages (manually discovered via web search).
// Note: handle is derived from the route; we store the marketplace URL as the seed whop_url.
const seeds = [
  { handle: 'sbsignals', whop_url: 'https://whop.com/marketplace/sbsignals/', name: 'SB Signals' },
  { handle: 'lune-trading-algo-signals-powered-by-ai', whop_url: 'https://whop.com/marketplace/lune-trading-algo-signals-powered-by-ai/', name: 'Lune AI Signals' },
  { handle: 'zeus-algo', whop_url: 'https://whop.com/marketplace/zeus-algo/', name: 'ZEUS ALGO Indicators' },

  { handle: 'timeless-agency', whop_url: 'https://whop.com/marketplace/timeless-agency/', name: 'Timeless Agency' },
  { handle: 'the-bready-bakery', whop_url: 'https://whop.com/marketplace/the-bready-bakery/', name: 'Viral Repost Agency' },
  { handle: 'dylan-blyuss', whop_url: 'https://whop.com/marketplace/dylan-blyuss/', name: 'Dylan Blyuss' },
  { handle: 'agency-growth-incubator', whop_url: 'https://whop.com/marketplace/agency-growth-incubator/', name: 'Agency Growth Incubator' },

  { handle: 'cryptic', whop_url: 'https://whop.com/marketplace/cryptic/', name: 'Trading With Cryptic Hustle' },
  { handle: 'kingline-capital-trading-group', whop_url: 'https://whop.com/marketplace/kingline-capital-trading-group/', name: 'Kingline Capital Trading Group' },
  { handle: 'jc-trading', whop_url: 'https://whop.com/marketplace/jc-trading/', name: 'JC Trading (JournalCharts)' },
  { handle: 'prosperity-trades', whop_url: 'https://whop.com/marketplace/prosperity-trades/', name: 'Prosperity Trades' },
];

const insert = db.prepare(
  `INSERT INTO gurus (
    id, name, handle, category, bio, whop_url, whop_synced_at,
    creator_name, brand_name,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let inserted = 0;
for (const s of seeds) {
  const handle = String(s.handle).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) continue;
  const id = cuid();
  const ts = now();
  insert.run(
    id,
    s.name || handle.replace(/-/g, ' '),
    handle,
    'Whop',
    null,
    s.whop_url,
    null,
    null,
    s.name || handle.replace(/-/g, ' '),
    ts,
    ts
  );
  inserted++;
  console.log('Inserted', handle, s.whop_url);
}

console.log('Done. Inserted:', inserted);
