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
  { handle: 'snipex', name: 'Snipex', category: 'Trading', whop_url: 'https://whop.com/discover/snipex/free-signals-discord-only/' },
  { handle: 'trading-signals-discord', name: 'Trading Signals Discord', category: 'Trading', whop_url: 'https://whop.com/discover/trading-signals-discord/smc-introduction-course/' },
  { handle: 'top-tier-signals-free', name: 'Top Tiers Signals', category: 'Trading', whop_url: 'https://whop.com/discover/top-tier-signals-free/' },
  { handle: 'option-signals-5a', name: '0DTE Option Signals', category: 'Trading', whop_url: 'https://whop.com/discover/option-signals-5a/' },

  // Agency / business
  { handle: 'agencysecrets-73', name: 'Agency Secrets', category: 'Business', whop_url: 'https://whop.com/discover/agencysecrets-73/' },
  { handle: 'the-chamber', name: 'The Chamber', category: 'Business', whop_url: 'https://whop.com/discover/the-chamber/join-free-discord/' },

  // AI / creator
  { handle: 'argus-ai-automation-academy', name: 'Argus AI Automation Academy', category: 'AI', whop_url: 'https://whop.com/discover/argus-ai-automation-academy/ai-automation-community/' },
  { handle: 'howtoai', name: 'Faceless Incubator (howtoai)', category: 'AI', whop_url: 'https://whop.com/discover/howtoai/' },
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
