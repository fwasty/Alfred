const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manually discovered via web_search (high-confidence Whop discover pages w/ strong review counts).
const urls = [
  'https://whop.com/discover/join-the-waitlist-60/',
  'https://whop.com/discover/bmtrades1/bmtrades-1on1/',
  'https://whop.com/discover/mentorship-7b/',
  'https://whop.com/discover/private-mentorship-7f/',
  'https://whop.com/discover/pjtradespremium/pjtradesfree/',
  'https://whop.com/discover/dispatch-standard/1-address-access/',
  'https://whop.com/discover/clip-cut-pro/?productId=prod_xJ9UGVjOqiRzq',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  return (parts[parts.length-1] || 'whop-item').toLowerCase();
}

let inserted = 0;
for (const u of urls) {
  const handle = handleFromUrl(u);
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    console.log('Skip (exists)', handle);
    continue;
  }
  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g, ' '), handle, 'Whop', null, u, null, ts, ts);
  inserted++;
  console.log('Inserted', handle, u);
}

console.log('\nInserted total:', inserted);
