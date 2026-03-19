const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manual seed adds for 2026-03-10 19:45 UTC (afternoon build-out)
// High-confidence Whop /discover pages found via conservative web_search.

const seeds = [
  // Trading
  { category: 'Trading', url: 'https://whop.com/discover/platinum-tier/kane-capital/' },
  { category: 'Trading', url: 'https://whop.com/discover/clavis-2/clavis-vip-membership/' },

  // Reselling / cook groups
  { category: 'Reselling', url: 'https://whop.com/discover/cookology/' },

  // AI / agency
  { category: 'AI / Agency', url: 'https://whop.com/discover/theaiagencylaunchpad/theaiagencylaunchpad/' },
  { category: 'AI / Agency', url: 'https://whop.com/discover/agencylabs/' },

  // Clipping / content rewards
  { category: 'Clipping', url: 'https://whop.com/discover/content-rewards-accelerator/content-rewards-accelerator-10/' },
  { category: 'Clipping', url: 'https://whop.com/discover/pro-content-rewards/' },
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
  const existing = db.prepare('SELECT id, whop_url FROM gurus WHERE handle = ?').get(handle);

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
