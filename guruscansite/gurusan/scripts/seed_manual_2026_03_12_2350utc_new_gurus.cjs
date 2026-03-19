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

// New additions discovered via Whop Discover search results (ICT/SMC/futures focused).
// Conservative: only pages that resolve (not "Whop not found").
const seeds = [
  { handle: 'ethan-ict', name: 'EthanTrades', category: 'Trading', whop_url: 'https://whop.com/discover/ethan-ict/' },
  { handle: 'strades-capital', name: 'Strades Capital', category: 'Trading', whop_url: 'https://whop.com/discover/strades-capital/' },
  { handle: 'orange-juice-trading', name: 'Orange Juice Trading', category: 'Trading', whop_url: 'https://whop.com/discover/orange-juice-trading/' },
  { handle: 'tradingsimple-19', name: 'TradingSimple', category: 'Trading', whop_url: 'https://whop.com/discover/tradingsimple-19/' },
  { handle: 'tradingpatiently', name: 'Trading Patiently Academy', category: 'Trading', whop_url: 'https://whop.com/discover/tradingpatiently/' },
];

let inserted = 0;
let updated = 0;

const upsert = db.transaction(() => {
  for (const s of seeds) {
    const existing = db.prepare('SELECT id, whop_url FROM gurus WHERE handle = ?').get(s.handle);
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
