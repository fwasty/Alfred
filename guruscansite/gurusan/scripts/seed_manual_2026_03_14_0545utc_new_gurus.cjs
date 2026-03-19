const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// High-confidence Whop pages confirmed via discovery/search.
// Notes:
// - Prefer /discover/* URLs when possible.
// - Skip anything that looks disabled/not-found.
const seeds = [
  {
    handle: 'creator-economy-academy',
    name: 'Creator Economy Academy',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/creator-economy-academy/',
  },
  {
    handle: 'the-reign-maker-academy',
    name: 'The Reign Maker Academy',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/the-reign-maker-academy/',
  },
  {
    handle: 'wealth-academy-pro',
    name: 'Wealth Academy Pro',
    category: 'Agency',
    whop_url: 'https://whop.com/discover/wealth-academy-pro/',
  },
  {
    handle: '25learning',
    name: 'YouTube Automation (25learning)',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/25learning/',
  },
  {
    handle: 'search-accelerator',
    name: 'Search Accelerator',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/search-accelerator/',
  },
  {
    handle: 'ai-tube-academy',
    name: 'AI Tube Academy',
    category: 'Creator',
    whop_url: 'https://whop.com/discover/ai-tube-academy/',
  },
  {
    handle: 'telegram-signal-group',
    name: 'ON Futures Signal Group',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/telegram-signal-group/',
  },
  {
    handle: 'nas100-signals',
    name: 'NAS100 Signals',
    category: 'Trading',
    whop_url: 'https://whop.com/discover/nas100-signals/',
  },
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
