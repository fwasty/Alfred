const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually curated, high-confidence Whop pages (discover/blog list sources).
const seeds = [
  {
    handle: 'the-midas-touch-trading-group',
    name: 'The Midas Touch Trading',
    category: 'Trading',
    whop_url: 'https://whop.com/premium-d4-6c2f/the-midas-touch-trading-group/',
  },
  {
    handle: 'goldboys',
    name: 'GoldBoys',
    category: 'Sports Picks',
    whop_url: 'https://whop.com/discover/goldboys/',
  },
  {
    handle: 'kingcapsports',
    name: 'KingCapSports',
    category: 'Sports Picks',
    whop_url: 'https://whop.com/discover/kingcapsports/',
  },
  {
    handle: 'tms-plus',
    name: 'TrustMySystem (TMS+)',
    category: 'Sports Picks',
    whop_url: 'https://whop.com/discover/tms-plus/',
  },
  {
    handle: 'ydc',
    name: 'YourDailyCapper (YDC)',
    category: 'Sports Picks',
    whop_url: 'https://whop.com/discover/ydc/',
  },
];

let inserted = 0;
let updated = 0;

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare(
      'UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), name = COALESCE(?, name), updated_at = ? WHERE handle = ?'
    ).run(s.whop_url, s.category, s.name, now(), s.handle);
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
  console.log('Inserted', s.handle);
  inserted++;
}

console.log(JSON.stringify({ inserted, updated }, null, 2));
