const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// High-review-count items discovered via search snippets.
const urls = [
  'https://whop.com/discover/whop-creators-ugc/whop-affiliates/',
  'https://whop.com/discover/imans-whop/imans-whop/',
  'https://whop.com/discover/clipitnew/clipit/',
  'https://whop.com/discover/content-rewards-campaigns/content-rewards-campaigns/',
  'https://whop.com/discover/cash-legends/legends-clips/',
  'https://whop.com/discover/black-box-business-clips/black-box-business-clips/',
  'https://whop.com/discover/pro-membership-16/navigationtrading/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

for (const u of urls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) continue;
  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g,' '), handle, 'Whop', null, u, null, ts, ts);
  console.log('Inserted', handle, u);
}
