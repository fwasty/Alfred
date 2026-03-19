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
// - Prefer /discover/<company>/<offer> URLs when possible.
// - Skip anything disabled/404.
const urls = [
  // Trading
  'https://whop.com/discover/free-discord-group/',

  // AI / agency
  'https://whop.com/discover/100kaiagency/',

  // TikTok Shop
  'https://whop.com/discover/tikgrowth/tiktokgrowthhub/',

  // Clipping / content rewards (still popular; should land in Clipping section)
  'https://whop.com/discover/clipitnew/clipit/',
  'https://whop.com/discover/whop-for-clippers-landing-page/whop-for-members/',

  // Gaming / coaching (high reviews)
  'https://whop.com/discover/irp-lite/community-noted/',

  // Creator / clipping community
  'https://whop.com/discover/commission-club/jordan-bown-s-clipping-communi/',
];

function handleFromWhopUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/, '');
  const url = new URL(clean);
  const parts = url.pathname.split('/').filter(Boolean);

  // /discover/<company>/<offer>
  if (parts[0] === 'discover' && parts[1]) return parts[1].toLowerCase();

  // /marketplace/<company>
  if (parts[0] === 'marketplace' && parts[1]) return parts[1].toLowerCase();

  // /joined/<company>
  if (parts[0] === 'joined' && parts[1]) return parts[1].toLowerCase();

  // /<company>/...
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
