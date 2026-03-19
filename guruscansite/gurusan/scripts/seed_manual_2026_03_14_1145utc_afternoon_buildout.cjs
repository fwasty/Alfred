const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// High-confidence Whop pages (confirmed 200 OK).
// Notes:
// - Prefer /discover/<handle>/ URLs.
// - Skip anything that looks disabled/not-found.
const seeds = [
  {
    handle: 'trading-lab-9a',
    name: 'The Trading Lab',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/trading-lab-9a/',
  },
  {
    handle: 'waas-mastery',
    name: 'WAAS MASTERY',
    category: 'Agency',
    whop_url: 'https://whop.com/discover/waas-mastery/',
  },
  {
    handle: 'project-capri',
    name: 'The Project',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/project-capri/',
  },
  {
    handle: 'review-hub-2',
    name: 'Review Hub',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/review-hub-2/',
  },
  {
    handle: 'lordsportspicks',
    name: 'LordSportsPicks',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/lordsportspicks/',
  },
  {
    handle: 'sportsville-picks',
    name: 'Sportsville Picks',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/sportsville-picks/',
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
