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
  'https://whop.com/discover/wall-st-trades-community/wall/',
  'https://whop.com/discover/axis-trading-lifetime-full-access/axis-trading/',
  'https://whop.com/discover/rb-trades-discord-server/rb-algo/',
  'https://whop.com/discover/elitetradersvip/elitetradersfree/',

  // Creator / social growth
  'https://whop.com/discover/the-creator-cult/free-course-1a/',
  'https://whop.com/discover/titansinnercircle/tiktoktitans/',
  'https://whop.com/discover/creatoracademyfree/creatoracademy2/',

  // Ecom / biz
  'https://whop.com/discover/exposcale/',
  'https://whop.com/discover/1on1-ads-mastery-mentorship-ecom/ecommerce-accelerator-course/',

  // Big generic beginner trading community (very high reviews; keep as Whop-native brand)
  'https://whop.com/discover/schoolofgods-paid/schoolofgods/',

  // Content rewards (treat as clipping/content rewards section, not a main course)
  'https://whop.com/discover/dropcourse/dropcourse-rewards/',
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
