const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

const seeds = [
  { handle: 'adt-futures-vip', name: 'ADT Futures VIP', category: 'Trading', whop_url: 'https://whop.com/adt-futures-vip/' },
  { handle: 'cash-flow-college', name: 'Cash Flow College', category: 'Trading', whop_url: 'https://whop.com/discover/cash-flow-college-combo/cash-flow-college/' },
  { handle: 'crypto-forex-futures', name: 'Crypto, Forex, Futures', category: 'Trading', whop_url: 'https://whop.com/discover/crypto-forex-futures/' },
  { handle: 'woof-streets1', name: 'Woof Streets', category: 'Trading', whop_url: 'https://whop.com/discover/woof-streets1/' },
  { handle: 'thetagains-discord', name: 'Thetagains Discord', category: 'Trading', whop_url: 'https://whop.com/marketplace/thetagains-discord/' },
  { handle: '0dte-options', name: '0DTE Options', category: 'Trading', whop_url: 'https://whop.com/discover/discord-0dte-spx-alerts/0dte-options/' },
];

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare('UPDATE gurus SET name = COALESCE(?, name), whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), updated_at = ? WHERE handle = ?')
      .run(s.name, s.whop_url, s.category, now(), s.handle);
    console.log('Updated', s.handle);
    continue;
  }

  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);
  console.log('Inserted', s.handle);
}
