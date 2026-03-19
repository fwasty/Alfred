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
// - Prefer /discover/<company>/<offer>/ URLs where possible.
// - Skip anything that 404s or looks like a generic category/collection.
const urls = [
  // Trading / markets
  'https://whop.com/discover/the-trading-club-premium/the-trading-club-free-discord/',
  'https://whop.com/discover/galaxy-trading-free-discord/',
  'https://whop.com/discover/topfloortrading1/free-discord-c5/',
  'https://whop.com/discover/free-trading-discord-access/',
  'https://whop.com/discover/free-discord-fc/',
  'https://whop.com/discover/newagetrading/new-age-trading-discord/',

  // Reselling
  'https://whop.com/discover/divine/divine-lite/',
  'https://whop.com/discover/signup-lowkey-discord/',
  'https://whop.com/discover/resell-nation/',
  'https://whop.com/discover/direct-resell/',

  // AI / agency
  'https://whop.com/discover/the-ai-agency-mastermind/',
  'https://whop.com/discover/ai-agent-system/',
  'https://whop.com/discover/ai-launchpad-vip/',
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
for (const u of urls) {
  const handle = handleFromWhopUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    console.log('Skip existing', handle);
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
  console.log('Inserted', handle, u);
}

console.log(`Done. Inserted ${inserted} new gurus.`);
