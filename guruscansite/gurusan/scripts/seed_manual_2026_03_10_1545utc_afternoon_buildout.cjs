const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() {
  return crypto.randomUUID().replace(/-/g, '');
}
function now() {
  return Date.now();
}

// Manual seed adds for 2026-03-10 15:45 UTC (afternoon build-out)
// High-confidence Whop company pages where root /<slug>/ resolves (via 307) to a joined/product route.
const seeds = [
  { handle: 'pastel-alpha', name: 'Pastel Alpha', category: 'Reselling', whop_url: 'https://whop.com/pastel-alpha/' },
  { handle: 'arcana-ltd', name: 'Arcana', category: 'Reselling', whop_url: 'https://whop.com/arcana-ltd/' },
  { handle: 'pokenotify', name: 'PokeNotify', category: 'Reselling', whop_url: 'https://whop.com/pokenotify/' },
  { handle: 'bandarsbounties', name: "Bandar's Bounties", category: 'Reselling', whop_url: 'https://whop.com/bandarsbounties/' },
  { handle: 'strike-access', name: 'Strike Access', category: 'Reselling', whop_url: 'https://whop.com/strike-access/' },
  { handle: 'resellers-paradise-6', name: 'Resellers Paradise', category: 'Reselling', whop_url: 'https://whop.com/resellers-paradise-6/' },
  { handle: 'resellingaccelerator', name: 'Reselling Accelerator', category: 'Reselling', whop_url: 'https://whop.com/resellingaccelerator/' },
  { handle: 'akari-ak', name: 'Akari', category: 'Reselling', whop_url: 'https://whop.com/akari-ak/' },
  { handle: 'swipesignals', name: 'SwipeSignals', category: 'Reselling', whop_url: 'https://whop.com/swipesignals/' },
  { handle: 'pureprofitsgroup', name: 'Pure Profits Group', category: 'Reselling', whop_url: 'https://whop.com/pureprofitsgroup/' },
  { handle: 'carted', name: 'Carted', category: 'Reselling', whop_url: 'https://whop.com/carted/' },
  { handle: 'malice', name: 'Malice', category: 'Reselling', whop_url: 'https://whop.com/malice/' },
  { handle: 'kckd-notify', name: 'KCKD', category: 'Reselling', whop_url: 'https://whop.com/kckd-notify/' },
  { handle: 'bread-and-butter', name: 'Bread and Butter', category: 'Reselling', whop_url: 'https://whop.com/bread-and-butter/' },
  { handle: 'mintech', name: 'Mintech', category: 'Reselling', whop_url: 'https://whop.com/mintech/' },
  { handle: 'akira', name: 'Akira', category: 'Reselling', whop_url: 'https://whop.com/akira/' },
  { handle: 'collectorscapital', name: 'Collectors Capital', category: 'Reselling', whop_url: 'https://whop.com/collectorscapital/' },
  { handle: 'flipalert', name: 'FlipAlert', category: 'Reselling', whop_url: 'https://whop.com/flipalert/' },
  { handle: 'astro-alerts-monthly', name: 'Astro Alerts', category: 'Reselling', whop_url: 'https://whop.com/astro-alerts-monthly/' },
  { handle: 'lockingprofits', name: 'Locking Profits', category: 'Reselling', whop_url: 'https://whop.com/lockingprofits/' },
];

let inserted = 0;
let updated = 0;

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare(
      'UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), name = COALESCE(?, name), updated_at = ? WHERE handle = ?'
    ).run(s.whop_url, s.category, s.name, now(), s.handle);
    console.log('Updated', s.handle);
    updated++;
    continue;
  }

  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);

  console.log('Inserted', s.handle);
  inserted++;
}

console.log(`Done. inserted=${inserted} updated=${updated}`);
