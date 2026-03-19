const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually curated, high-confidence Whop pages (discovered via search + Whop discover pages).
const seeds = [
  {
    handle: 'profits-pass',
    name: 'Profits Pass',
    category: 'Reselling',
    whop_url: 'https://whop.com/discover/profits-pass/reselling-secrets/',
  },
  {
    handle: 'vinted-reselling-guide-2025',
    name: 'Vinted Reselling Guide (2025)',
    category: 'Reselling',
    whop_url: 'https://whop.com/discover/vinted-reselling-guide-2025/',
  },
  {
    handle: 'reselling-accelerator',
    name: 'Reselling Accelerator',
    category: 'Reselling',
    whop_url: 'https://whop.com/discover/reselling-accelerator/resellingaccelerator/',
  },
  {
    handle: 'theavatarempire',
    name: 'The Avatar Empire',
    category: 'Marketing',
    whop_url: 'https://whop.com/discover/theavatarempire/ofm-free-course/',
  },
  {
    handle: 'retailtraderz',
    name: 'RetailTraderz',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/retailtraderz/retailtraderz-indicators-lifetime/',
  },
  {
    handle: 'trading-university-ac',
    name: 'Trading University',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/trading-university-ac/emmanueltrades/',
  },
  {
    handle: 'tradevipe-trading-journal',
    name: 'Tradevipe Trading Journal',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/tradevipe-trading-journal/tradevipe-trading-journal-96/',
  },
];

let inserted = 0;
let updated = 0;

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare(
      'UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), name = COALESCE(?, name), updated_at = ? WHERE handle = ?'
    ).run(s.whop_url, s.category, s.name, now(), s.handle);
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
  console.log('Inserted', s.handle);
  inserted++;
}

console.log(JSON.stringify({ inserted, updated }, null, 2));
