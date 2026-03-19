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

// Conservative additions: confirmed Whop pages.
// Notes:
// - Many /discover/* URLs redirect to /joined/* (authenticated shell). That's OK; ingest follows OG where possible.
// - Skipped low-confidence pages (e.g., "Whop not found").
const seeds = [
  { handle: 'wealthgroup', name: 'Wealth Group', category: 'Trading', whop_url: 'https://whop.com/discover/wealthgroup/' },
  { handle: 'options-insider', name: 'Options Insider', category: 'Trading', whop_url: 'https://whop.com/discover/options-insider/' },
  { handle: 'moneymotive', name: 'MoneyMotive A+', category: 'Trading', whop_url: 'https://whop.com/discover/moneymotive/' },
  { handle: 'stock-hours', name: 'Stock Hours', category: 'Trading', whop_url: 'https://whop.com/discover/stock-hours/' },
  { handle: 'fu-money-club', name: 'FU Money Club', category: 'Trading', whop_url: 'https://whop.com/discover/fu-money-club/' },
  { handle: 'the-ones-that-know', name: 'The Ones That Know', category: 'Trading', whop_url: 'https://whop.com/discover/the-algo-tools/the-ones-that-know/' },
  { handle: 'themarketlens', name: 'The Market Lens', category: 'Trading', whop_url: 'https://whop.com/discover/themarketlens/' },
  { handle: 'joinmomentum', name: 'Momentum', category: 'Trading', whop_url: 'https://whop.com/discover/joinmomentum/' },
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
      console.log('Updated', s.handle, '->', s.whop_url || existing.whop_url);
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
