const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manual build-out (2026-03-14 ~23:45 UTC): high-confidence Whop discover pages
// Sources: Brave search results (site:whop.com/discover ...)
const urls = [
  'https://whop.com/discover/adt/premium-adt/',
  'https://whop.com/discover/greenys-calls/',
  'https://whop.com/discover/team2trading/',
  'https://whop.com/discover/tradingaccelerator-2/',
  'https://whop.com/discover/hjtrades/',
  'https://whop.com/discover/ipda-x/',
  'https://whop.com/discover/maestros-trading-comunidad/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length - 1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ? OR whop_url = ?').get(handle, u);
  if (existing) continue;

  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g, ' '), handle, 'Whop', null, u, null, ts, ts);

  inserted++;
  console.log('Inserted', handle, u);
}

console.log(`Done. Inserted ${inserted} new gurus.`);
