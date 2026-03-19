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

// Goal: seed new brands with confirmed Whop pages, then sync via /api/whop/sync to ingest offers + socials.
// Constraints: conservative adds (only resolvable Whop URLs). If unsure, don't add.
const seeds = [
  // Trading
  { handle: 'meliorinvesting', name: 'Melior Investing — Trading Mentorship', category: 'Trading', whop_url: 'https://whop.com/discover/meliorinvesting/' },
  { handle: 'pjtradespremium', name: 'PJ Trades Premium', category: 'Trading', whop_url: 'https://whop.com/discover/pjtradespremium/pj-trade/' },
  { handle: 'wtc-live-trading', name: 'WTC Live Trading', category: 'Trading', whop_url: 'https://whop.com/discover/wtc-live-trading/1-hour-mentorship-call-christian-lee/' },
  { handle: 'tradingmadesimple', name: 'Trading Made Simple', category: 'Trading', whop_url: 'https://whop.com/discover/tradingmadesimple/basic-plan-69/' },

  // Online money / automation
  { handle: 'youtube-grow-automation-course', name: 'YouTube Grow — Automation Course', category: 'Business', whop_url: 'https://whop.com/discover/youtube-grow-automation-course/' },
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
