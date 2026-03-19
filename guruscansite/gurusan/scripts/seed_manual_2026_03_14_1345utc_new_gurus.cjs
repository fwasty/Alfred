const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// High-confidence Whop pages (confirmed 200 OK). Note: many /discover/ URLs redirect to /joined/ but remain valid.
// Keep this list small + high-signal.
const seeds = [
  {
    handle: 'surge-media',
    name: 'Surge Media',
    category: 'Agency',
    whop_url: 'https://whop.com/discover/surge-media/',
  },
  {
    handle: 'ecomparadise-pro',
    name: 'Ecom Paradise',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/ecomparadise-pro/',
  },
  {
    handle: '8-figures-complete-blueprints',
    name: '8 Figures Complete Blueprints (Ecom Squad)',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/8-figures-complete-blueprints/',
  },
  {
    handle: 'hotty-picks',
    name: 'Hotty Picks',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/hotty-picks/',
  },
  {
    handle: 'a-p-premium-picks',
    name: 'A.P Premium Picks',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/a-p-premium-picks/',
  },
  {
    handle: 'laz-picks',
    name: 'High Hit Rate Picks (Laz Picks)',
    category: 'Sports',
    whop_url: 'https://whop.com/discover/laz-picks/',
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
