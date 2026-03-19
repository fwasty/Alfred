const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manual seed adds for 2026-03-10 17:45 UTC (end-of-day build-out)
// Goal: add high-confidence Whop pages (mostly /discover/ canonical pages) so /api/whop/sync can ingest offers + socials.
// Note: For nested discover URLs we use the last path segment as the handle.

const seeds = [
  // Trading / signals
  { category: 'Trading', url: 'https://whop.com/discover/top-tier-signals/' },
  { category: 'Trading', url: 'https://whop.com/discover/source-trading/signals-room/' },
  { category: 'Trading', url: 'https://whop.com/discover/the-champagne-room/?productId=prod_UZAoWCf1EX0Z9' },
  { category: 'Trading', url: 'https://whop.com/discover/masterdaytrading-discord-trading-room/' },
  { category: 'Trading', url: 'https://whop.com/discover/uris-trading/discord-trading-room/' },
  { category: 'Trading', url: 'https://whop.com/discover/vip-lifetime-38/prosperatrading/' },

  // Reselling / cook groups
  { category: 'Reselling', url: 'https://whop.com/discover/alistreselling/' },
  { category: 'Reselling', url: 'https://whop.com/discover/paragn-network/' },
  { category: 'Reselling', url: 'https://whop.com/discover/premium-membership-f1/' },

  // AI / agency
  { category: 'AI / Agency', url: 'https://whop.com/discover/argus-ai-automation-academy/' },
  { category: 'AI / Agency', url: 'https://whop.com/discover/ai-agency-accelerator/' },
  { category: 'AI / Agency', url: 'https://whop.com/discover/agency-accelerants/operatoros-ai-agent-academy/' },
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/, '');
  const parts = clean.split('/');
  const last = parts[parts.length - 1];
  return (last || 'whop-item').toLowerCase();
}

let inserted = 0;
let updated = 0;

for (const s of seeds) {
  const handle = handleFromUrl(s.url);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    db.prepare(
      'UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), updated_at = ? WHERE handle = ?'
    ).run(s.url, s.category, now(), handle);
    console.log('Updated', handle, s.url);
    updated++;
    continue;
  }

  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g, ' '), handle, s.category, null, s.url, null, ts, ts);
  console.log('Inserted', handle, s.url);
  inserted++;
}

console.log(`Done. inserted=${inserted} updated=${updated}`);
