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
  // Trading
  'https://whop.com/discover/prestigetradingdiscord/profitability-partner-program/',
  'https://whop.com/discover/discord-member-no-1on1/aval-trading-path-to-profit/',

  // Ecommerce / deals
  'https://whop.com/discover/luxury-paid/luxury-tools-2/',
  'https://whop.com/discover/e-commercebuilders/ecommercebuilders/',
  'https://whop.com/discover/deal-soldier/free-product-41/',
  'https://whop.com/discover/the-wholesale-network-mastermind/thewholesalenetwork/',
  'https://whop.com/discover/emoney/emoney/',

  // Sports betting
  'https://whop.com/discover/beat-the-books/beat-the-books/',
  'https://whop.com/discover/bravosixpicks/bravosixpicks/',
  'https://whop.com/discover/betbigben/',
  'https://whop.com/discover/swt/',
  'https://whop.com/discover/goat-sports-betting/goat-sports-betting-lifetime/',
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
