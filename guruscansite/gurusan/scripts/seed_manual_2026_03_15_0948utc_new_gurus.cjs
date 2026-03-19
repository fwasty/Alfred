const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manual adds from Whop Discover pages (confirmed URLs).
const seeds = [
  { handle: 'pbalerts', name: 'PB Alerts / TheSwingingBull', category: 'Trading', whop_url: 'https://whop.com/discover/pbalerts/coaching-program-theswingingbull/' },
  { handle: 'free-community-ba-ddbd', name: 'FDL Free Trading Course', category: 'Trading', whop_url: 'https://whop.com/discover/free-community-ba-ddbd/' },
  { handle: 'shitshow', name: 'ShitShow Trading', category: 'Trading', whop_url: 'https://whop.com/discover/shitshow/shit-show-trading-course/' },
  { handle: 'ascend-trading', name: 'Ascend Trading', category: 'Trading', whop_url: 'https://whop.com/discover/ascend-trading/course-fractal-strategy-that-made-me-100k-mo/' },
  { handle: 'zero-to-1-traders-club', name: 'Zero to 1% Traders Club', category: 'Trading', whop_url: 'https://whop.com/discover/zero-to-1-traders-club/' },
];

let inserted = 0;
let updated = 0;

const upsert = db.transaction(() => {
  for (const s of seeds) {
    const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
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
