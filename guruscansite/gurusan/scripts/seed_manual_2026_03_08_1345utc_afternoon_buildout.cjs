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
// - Prefer /discover/<company>/<offer>/ URLs when we have them.
// - If Whop redirects to /joined/<company>/, we still accept it (handle extraction works).
// - Skip anything that returns “Whop not found”.
const urls = [
  // Trading
  'https://whop.com/discover/ag-trades-education/premium-discord-80/',
  'https://whop.com/discover/amnmentorship/premium-discord-7-day-free-trial/',
  'https://whop.com/discover/prodigy-investors/premium-discord-weekly/',
  'https://whop.com/discover/snipex/free-signals-discord-only/',
  'https://whop.com/joined/trading-signals-discord/',

  // Reselling / cook groups
  'https://whop.com/joined/the-yard/',
  'https://whop.com/joined/universalcook/',
  'https://whop.com/joined/resellsignals1on1/',

  // Sports betting
  'https://whop.com/joined/ekuselias/',
  'https://whop.com/joined/magic-bets/',

  // Ecom / dropshipping
  'https://whop.com/discover/new-1on1-mentorship/wlp-a-z-organic-dropshipping-course-51/',
  'https://whop.com/joined/ecom-experts2/',
  'https://whop.com/joined/undergroundecom/',
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
