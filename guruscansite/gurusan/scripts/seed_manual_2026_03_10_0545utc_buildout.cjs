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

// Conservative additions: confirmed Whop marketplace pages.
const seeds = [
  { handle: 'tradercapital', name: 'Trader Capital LLC', category: 'Trading', whop_url: 'https://whop.com/marketplace/tradercapital/' },
  { handle: 'bullface-wealth-group', name: 'BullFace Wealth Group', category: 'Trading', whop_url: 'https://whop.com/marketplace/bullface-wealth-group/' },
  { handle: 'tradeatease', name: 'TradeAtEase', category: 'Trading', whop_url: 'https://whop.com/marketplace/tradeatease/' },

  // URL repairs (prefer marketplace over discover when available)
  { handle: 'the-options-cartel', name: 'The Options Cartel', category: 'Trading', whop_url: 'https://whop.com/marketplace/the-options-cartel/' },
  { handle: 'stock-hours', name: 'Stock Hours', category: 'Trading', whop_url: 'https://whop.com/marketplace/stock-hours/' },
];

const upsert = db.transaction(() => {
  for (const s of seeds) {
    const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
    if (existing) {
      db.prepare(
        'UPDATE gurus SET name = COALESCE(?, name), whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), updated_at = ? WHERE handle = ?'
      ).run(s.name, s.whop_url, s.category, now(), s.handle);
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
});

upsert();
