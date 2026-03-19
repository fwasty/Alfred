const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Goal: seed new popular brands with confirmed Whop pages, then sync via /api/whop/sync.
// Constraints: conservative adds (only resolvable Whop URLs). If unsure, don't add.
const seeds = [
  // Trading
  { handle: 'masterdaytrading-mentorship-program', name: 'Master Day Trading Mentorship', category: 'Trading', whop_url: 'https://whop.com/discover/masterdaytrading/masterdaytrading-mentorship-program/' },

  // AI
  { handle: 'ai-ml-automation-community', name: 'AI + ML & Automation Community', category: 'AI', whop_url: 'https://whop.com/discover/ai-ml-automation-community/' },
  { handle: 'system-and-ai-automation-service', name: 'System & AI Automation Service', category: 'AI', whop_url: 'https://whop.com/discover/system-and-ai-automation-service/' },

  // Trading (signals)
  { handle: 'signals-30-1e42', name: 'Freedom Empire', category: 'Trading', whop_url: 'https://whop.com/discover/signals-30-1e42/freedomempire/' },
  { handle: 'forex-empire-88', name: 'Forex Empire', category: 'Trading', whop_url: 'https://whop.com/discover/forex-empire-88/join-our-discord-for-free/' },
];

let inserted = 0;
let updated = 0;

const upsert = db.transaction(() => {
  for (const s of seeds) {
    const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
    if (existing) {
      db.prepare(
        'UPDATE gurus SET name = COALESCE(?, name), whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), updated_at = ? WHERE handle = ?'
      ).run(s.name, s.whop_url, s.category, now(), s.handle);
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
    console.log('Inserted', s.handle, '->', s.whop_url);
    inserted++;
  }
});

upsert();
console.log(JSON.stringify({ inserted, updated }, null, 2));
