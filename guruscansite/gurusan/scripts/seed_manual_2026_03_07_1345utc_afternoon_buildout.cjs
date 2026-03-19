const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manual discoveries (high confidence Whop pages; focus = popular brands w/ meaningful review counts).
// Source: conservative web_search (skip low-confidence / auth-gated pages).
const urls = [
  'https://whop.com/discover/suits-commerce/',
  'https://whop.com/discover/houseofprofits/houseofprofits/',
  'https://whop.com/discover/pro-sports-advice/elite-vip-membership/',
  'https://whop.com/discover/max-options-trading/max-options-trading-1/',
  'https://whop.com/discover/goggins-contact/',
  'https://whop.com/discover/sharpmoney/',
  'https://whop.com/discover/cmr-premium-membership/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/, '');
  const parts = clean.split('/');
  return (parts[parts.length - 1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
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

console.log('Done. Inserted:', inserted);
