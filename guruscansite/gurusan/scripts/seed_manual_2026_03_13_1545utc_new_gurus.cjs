const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Goal: seed new brands with confirmed Whop pages, then sync via /api/whop/sync to ingest offers + socials.
// Constraints: conservative adds (only resolvable Whop URLs). If unsure, don't add.
const seeds = [
  // Trading
  { handle: 'majorleaguetrading', name: 'Major League Trading', category: 'Trading', whop_url: 'https://whop.com/discover/majorleaguetrading/' },
  { handle: 'high-alpha-trends', name: 'High Alpha Trends (HAT)', category: 'Trading', whop_url: 'https://whop.com/discover/high-alpha-trends/' },
  { handle: 'vte', name: 'Voss Trading', category: 'Trading', whop_url: 'https://whop.com/discover/vte/' },
  { handle: 'itrade', name: 'iTrade', category: 'Trading', whop_url: 'https://whop.com/discover/monthly-access-to-itrade/' },
  { handle: 'inter-equity-trading-course', name: 'Inter Equity', category: 'Trading', whop_url: 'https://whop.com/discover/inter-equity-trading-course/' },
  { handle: 'crosstrade', name: 'CrossTrade', category: 'Trading', whop_url: 'https://whop.com/discover/crosstrade/' },

  // Crypto
  { handle: 'cryptohub-premium-trading', name: 'CryptoHub Premium Trading', category: 'Crypto', whop_url: 'https://whop.com/discover/cryptohub-premium-trading/' },

  // Indicators / signals (still trading-adjacent)
  { handle: 'trim-trading-monthly', name: 'Trim Trading', category: 'Trading', whop_url: 'https://whop.com/discover/trim-trading-monthly/' },
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
