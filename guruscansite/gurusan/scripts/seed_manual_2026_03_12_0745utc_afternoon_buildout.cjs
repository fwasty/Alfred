const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-12 ~07:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Keep to high-confidence brands/communities with real Whop pages.
const items = [
  // Crypto
  { handle: 'cryptocrusaders', url: 'https://whop.com/discover/cryptocrusaders/', category: 'Crypto' },
  { handle: 'crypto-viper', url: 'https://whop.com/discover/crypto-viper/', category: 'Crypto' },
  { handle: 'tradyom', url: 'https://whop.com/discover/tradyom/cryptotrades/', category: 'Crypto' },
  { handle: 'thecryptoschool', url: 'https://whop.com/discover/thecryptoschool/thecss/', category: 'Crypto' },
  { handle: 'crypto-rich-trading', url: 'https://whop.com/discover/crypto-rich-trading/', category: 'Crypto' },

  // Ecom / Tools
  { handle: 'ecom-tools-pro', url: 'https://whop.com/discover/ecom-tools-pro/ecom-tools-lifetime/', category: 'Ecom' },
  { handle: 'elite-lifetime', url: 'https://whop.com/discover/elite-lifetime/ecomhub/', category: 'Ecom' },
  { handle: 'diamond-student-ce', url: 'https://whop.com/discover/diamond-student-ce/ecom-empire-group/', category: 'Ecom' },
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
