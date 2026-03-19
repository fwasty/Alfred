const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// High-confidence Whop pages (confirmed 200 OK; many /discover/ slugs redirect to /joined/).
// Keep this list small + high-signal.
const seeds = [
  {
    handle: 'tiktokpayday',
    name: 'TikTokPayDay',
    category: 'Agency',
    whop_url: 'https://whop.com/discover/tiktokpayday/',
  },
  {
    handle: 'pickd',
    name: 'Pickd',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/pickd/',
  },
  {
    handle: 'prize-picks-gurus',
    name: 'Prize Picks Gurus',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/prize-picks-gurus/',
  },
  {
    handle: 'coverkingspicks',
    name: 'CoverKings Picks',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/coverkingspicks/',
  },
  {
    handle: 'topshotpicks',
    name: 'Top Shot Picks',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/topshotpicks/',
  },
  {
    handle: 'premium-f3',
    name: 'Power Picks',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/premium-f3/',
  },
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
