const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// High-confidence Whop pages confirmed from Whop blog “online business courses” list.
// Prefer /discover/* URLs when available.
const seeds = [
  {
    handle: 'start-a-biz-today-20-copy',
    name: 'KP University (Start a Biz Today)',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/start-a-biz-today-20-copy/',
  },
  {
    handle: 'lead-academy',
    name: 'Lead Academy',
    category: 'Agency',
    whop_url: 'https://whop.com/discover/lead-academy/',
  },
  {
    handle: 'the-sales-dojo',
    name: 'The Sales Dojo',
    category: 'Agency',
    whop_url: 'https://whop.com/discover/the-sales-dojo/',
  },
  {
    handle: 'tsa',
    name: 'The School of Threaded Arts',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/tsa/',
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
