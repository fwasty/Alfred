const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-11 ~17:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Only add high-confidence brands/communities with real Whop pages.
const items = [
  // Trading
  { handle: 'tradingarena', url: 'https://whop.com/discover/tradingarena/', category: 'Trading' },
  { handle: 'max-options-trading', url: 'https://whop.com/discover/max-options-trading/mot-orb-basic/', category: 'Trading' },
  { handle: 'options-insider', url: 'https://whop.com/discover/options-insider/', category: 'Trading' },
  { handle: 'options-hq', url: 'https://whop.com/discover/options-hq/', category: 'Trading' },
  { handle: 'elite-options', url: 'https://whop.com/discover/elite-options/elite-options/', category: 'Trading' },
  { handle: 'the-options-cartel', url: 'https://whop.com/discover/the-options-cartel/', category: 'Trading' },

  // Agency
  { handle: 'agencysecrets', url: 'https://whop.com/discover/agencysecrets/', category: 'Agency' },
  { handle: 'agency-blueprint', url: 'https://whop.com/discover/agency-blueprint/', category: 'Agency' },
  { handle: 'agency-network', url: 'https://whop.com/discover/agency-network/', category: 'Agency' },

  // Ecom
  { handle: 'ecomsociety', url: 'https://whop.com/discover/ecomsociety/', category: 'Ecom' },
  { handle: 'ecom-empire-group', url: 'https://whop.com/discover/ecom-empire-group/', category: 'Ecom' },
  { handle: 'toolpack', url: 'https://whop.com/discover/toolpack/', category: 'Ecom' },
  { handle: 'ecomclubfree', url: 'https://whop.com/discover/ecomclubfree/', category: 'Ecom' },
];

let inserted = 0;
let skipped = 0;
const insertedHandles = [];

for (const it of items) {
  const handle = (it.handle || '').toLowerCase().trim();
  if (!handle) continue;

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
