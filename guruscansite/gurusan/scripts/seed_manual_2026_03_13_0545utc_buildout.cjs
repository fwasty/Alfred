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

// Goal: seed new brands with confirmed Whop pages, then sync via /api/whop/sync to ingest offers + socials.
// Constraints: conservative adds (only resolvable Whop URLs).
const seeds = [
  // AI
  { handle: 'ai-automation-hub', name: 'AI AUTOMATION HUB', category: 'AI', whop_url: 'https://whop.com/discover/ai-automation-hub/' },
  { handle: 'ai-creator-blueprint', name: 'AI Creator Blueprint', category: 'AI', whop_url: 'https://whop.com/discover/ai-creator-blueprint/' },

  // Clipping / content rewards
  { handle: 'clipping-ai-5', name: 'Clipping.ai (Content Rewards)', category: 'Clipping', whop_url: 'https://whop.com/discover/clipping-ai-5/' },

  // Ecom
  { handle: 'ecom-tools-com', name: 'Ecom Tools', category: 'Ecom', whop_url: 'https://whop.com/discover/ecom-tools-com/' },

  // Trading / crypto communities
  { handle: 'premium-discord-channel', name: 'Cryptobytez Ultimate Trading Discord', category: 'Trading', whop_url: 'https://whop.com/discover/premium-discord-channel/' },
  { handle: 'warrior-group-4f', name: 'WARRIOR GROUP', category: 'Trading', whop_url: 'https://whop.com/discover/warrior-group-4f/' },
];

let inserted = 0;
let updated = 0;

const upsert = db.transaction(() => {
  for (const s of seeds) {
    const existing = db.prepare('SELECT id, whop_url FROM gurus WHERE handle = ?').get(s.handle);
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
