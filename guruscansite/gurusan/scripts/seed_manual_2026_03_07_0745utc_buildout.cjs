const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manual discoveries (high confidence Whop pages; focus = popular courses/brands).
// Source: targeted web search (keep conservative; skip low-confidence).
const urls = [
  // Trading
  'https://whop.com/discover/hivescale/hive-scale-tier-3-hive-elite/',
  'https://whop.com/discover/real-deal-futures-free-discord/',
  'https://whop.com/discover/vip-ff-e142/',
  'https://whop.com/discover/vip-discord-b0/',
  'https://whop.com/discover/vip-live-trading-signals/',

  // AI / creator
  'https://whop.com/discover/ai-automation-academy/',
  'https://whop.com/discover/100k-academy/',
  'https://whop.com/discover/automation-ai-academy/',

  // Ecommerce
  'https://whop.com/discover/proper-ecom-academy-97/',
  'https://whop.com/discover/ecompro-elite-academy/',

  // Reselling / cook groups
  'https://whop.com/discover/paragn-network/',
  'https://whop.com/discover/resellkings/retail-world/',

  // Sports picks
  'https://whop.com/discover/officialpicks/',
  'https://whop.com/discover/sports-capitalists-premium/',
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
