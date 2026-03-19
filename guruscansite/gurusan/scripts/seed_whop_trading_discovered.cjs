const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Discovered via web search (discover/ pages). We'll ingest from canonical og:url when possible.
const whopUrls = [
  'https://whop.com/mikes-trades/',
  'https://whop.com/dtr-trading/',
  'https://whop.com/discover/cmptradingroom/?productId=prod_YW3n7zbLhmRwI',
  'https://whop.com/tradegreater/',
  'https://whop.com/discover/summit-trading-systems/',
  'https://whop.com/discover/tradewithinsight/trade-with-insight-futures/',
  'https://whop.com/discover/max-options-trading/futures-one-maxstermind/',
  'https://whop.com/discover/trustedsignals/bots-indicators/',
  'https://whop.com/discover/ai-signals-1/ai-signals-free-indicators/',
  'https://whop.com/discover/cryptofutures/',
  'https://whop.com/discover/funding-secrets-74/',
  'https://whop.com/discover/propfirmprofits/',
];

function handleFromUrl(u) {
  const clean = u.split('?')[0].replace(/\/+$/,'');
  const parts = clean.split('/');
  const last = parts[parts.length-1];
  // for nested discover URLs, use last segment
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
  ).run(id, handle.replace(/-/g,' '), handle, 'Trading', null, u, null, ts, ts);
  console.log('Inserted', handle, u);
}
