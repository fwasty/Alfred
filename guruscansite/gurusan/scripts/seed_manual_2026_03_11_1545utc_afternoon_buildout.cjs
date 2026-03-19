const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Goal: add high-confidence brands/communities, then sync via /api/whop/sync.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - This seed script allows explicit handles when Whop redirects cause a poor handle.
const items = [
  {
    handle: 'investinglab',
    url: 'https://whop.com/discover/innercircle/investinglab/',
    category: 'Trading',
  },
  {
    handle: 'mastermindaccess',
    url: 'https://whop.com/discover/mastermind/mastermindaccess/',
    category: 'Ecom',
  },
  {
    handle: 'brale-mastermind',
    url: 'https://whop.com/discover/lifetime-access-one-time-payment/brale-mastermind/',
    category: 'Ecom',
  },
  {
    handle: '1-recession-proof-mastermind',
    url: 'https://whop.com/discover/1-recession-proof-mastermind/1-recession-proof-mastermind/',
    category: 'Agency',
  },
];

let inserted = 0;
let skipped = 0;
const insertedHandles = [];

for (const it of items) {
  const handle = it.handle.toLowerCase();
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    skipped++;
    continue;
  }

  const id = cuid();
  const ts = now();
  const name = handle.replace(/-/g, ' ');

  db.prepare(
    `INSERT INTO gurus (
      id, name, handle, category, bio, whop_url, whop_synced_at,
      creator_name, brand_name,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    handle,
    it.category || 'Whop',
    null,
    it.url,
    null,
    null,
    name,
    ts,
    ts
  );

  inserted++;
  insertedHandles.push(handle);
  console.log('Inserted', handle, it.url);
}

console.log(JSON.stringify({ inserted, skipped, insertedHandles }, null, 2));
