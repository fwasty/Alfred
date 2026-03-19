const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// High-confidence Whop pages confirmed via discovery/search.
// Notes:
// - Prefer /discover/* URLs when possible.
// - Skip anything that looks disabled/not-found.
const seeds = [
  {
    handle: 'sar-trading',
    name: 'SAR Trading',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/sar-trading/',
  },
  {
    handle: '100kacademy',
    name: '100K Academy',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/100kacademy/',
  },
  {
    handle: 'omariacademy',
    name: 'Omari Academy',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/omariacademy/',
  },
  {
    handle: 'ecom-skillzz-academy',
    name: 'Kingdom Ecom VIP Community',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/ecom-skillzz-academy/',
  },
  {
    handle: 'knight-s-academy',
    name: 'Ecom Kings Academy',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/knight-s-academy/',
  },
  {
    handle: 'ecom-warriors-website-template',
    name: 'Ecom Warriors Academy',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/ecom-warriors-website-template/',
  },
  {
    handle: 'ecomacademybyaaron',
    name: 'Ecom Academy (by Aaron)',
    category: 'Ecom',
    whop_url: 'https://whop.com/discover/ecomacademybyaaron/',
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
