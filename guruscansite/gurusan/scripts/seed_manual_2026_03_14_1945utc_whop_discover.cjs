const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manually discovered via web_search (high-confidence Whop discover pages w/ strong review counts / brand recognition).
const urls = [
  'https://whop.com/discover/gold-plan/diamond-plan-44/',
  'https://whop.com/discover/content-academy/',
  'https://whop.com/discover/studydropshipping/study-dropshipping-free-course/',
  'https://whop.com/discover/online-internet-marketing/free-dropshipping-course-8f/',
  'https://whop.com/discover/wlp-a-z-organic-dropshipping-course-51/',
  'https://whop.com/discover/6-figure-a-z-dropshipping-course/',
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
