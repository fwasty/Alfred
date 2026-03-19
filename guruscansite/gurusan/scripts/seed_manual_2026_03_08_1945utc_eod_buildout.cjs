const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Source: Whop blog roundup: https://whop.com/blog/options-trading-guide-discord-servers/ (Feb 2026)
// Goal: add high-confidence brands/communities, then sync via /api/whop/sync.
const urls = [
  'https://whop.com/stockdads/',
  'https://whop.com/discover/alphamarketpro/',
  'https://whop.com/discover/panda-options/',
  'https://whop.com/discover/thedailytraders/',
  'https://whop.com/discover/cash-flow-university-llc/',
  'https://whop.com/discover/ztradez/',
  'https://whop.com/discover/owls-options-traders/',
  'https://whop.com/discover/stock-hours/',
  'https://whop.com/discover/lks/',
  'https://whop.com/discover/rawstocks/',
  'https://whop.com/discover/emmanueltrades/',
  'https://whop.com/discover/patiencetrading/',
  'https://whop.com/discover/teamrawr/',
  'https://whop.com/discover/highstrike/',
  'https://whop.com/discover/onlyoptionstrades/',
  'https://whop.com/discover/diamondtrading/',
  'https://whop.com/discover/twprta/',
  'https://whop.com/discover/botostrading/',
  'https://whop.com/discover/options-insider/',
  'https://whop.com/discover/elite-options/',
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
