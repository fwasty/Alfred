const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

const whopUrls = [
  'https://whop.com/discover/whop-creators-ugc/whop-clips/',
  'https://whop.com/discover/clippingculture/clippingculture/',
  'https://whop.com/discover/theclippingagency/theclippingagency/',
  'https://whop.com/discover/app-clippin/',
  'https://whop.com/discover/cash-legends/legends-clips/',
  'https://whop.com/discover/paid-in-clips-premium/paidinclips/',
  'https://whop.com/discover/black-box-business-clips/black-box-business-clips/',
  'https://whop.com/discover/ugcuniversity/ugcu-premium/',
  'https://whop.com/discover/whop-creators-ugc/ugc-factory/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  const last = parts[parts.length-1];
  return (last || 'whop-item').toLowerCase();
}

for (const u of whopUrls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) continue;
  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g,' '), handle, 'Clipping', null, u, null, ts, ts);
  console.log('Inserted', handle, u);
}
