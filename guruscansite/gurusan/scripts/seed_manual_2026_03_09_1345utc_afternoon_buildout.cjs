const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Goal: add high-confidence brands/communities, then sync via /api/whop/sync.
// Notes:
// - Prefer non-generic pages with clear product/brand identity.
// - Skip low-confidence “directory/collection” pages.
const urls = [
  // Trading tools / communities
  'https://whop.com/chart-wise/ict-fusion-pro-1a/',
  'https://whop.com/dodgys-dungeon/dodgy-s-complete-ict-bootcamp/',
  'https://whop.com/discover/premiere-access/option-drops/',
  'https://whop.com/heatseeker/heatseeker/',

  // Ecom / business
  'https://whop.com/ecom-essentials/ecom-essentials/',
];

function handleFromWhopUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/, '');
  const url = new URL(clean);
  const parts = url.pathname.split('/').filter(Boolean);

  // /discover/<company>/<offer>
  if (parts[0] === 'discover' && parts[1]) return parts[parts.length - 1].toLowerCase();

  // /marketplace/<company>
  if (parts[0] === 'marketplace' && parts[1]) return parts[1].toLowerCase();

  // /joined/<company>
  if (parts[0] === 'joined' && parts[1]) return parts[1].toLowerCase();

  // /<company>/<offer>
  if (parts.length >= 2) return parts[parts.length - 1].toLowerCase();

  // /<company>
  return (parts[0] || 'whop-item').toLowerCase();
}

let inserted = 0;
let skipped = 0;
const insertedHandles = [];

for (const u of urls) {
  const handle = handleFromWhopUrl(u);
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
    'Whop',
    null,
    u,
    null,
    null,
    name,
    ts,
    ts
  );

  inserted++;
  insertedHandles.push(handle);
  console.log('Inserted', handle, u);
}

console.log(JSON.stringify({ inserted, skipped, insertedHandles }, null, 2));
