const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g, ''); }
function now() { return Date.now(); }

// Manually discovered Whop pages (confirmed URLs).
// Added 2026-03-12 ~05:45 UTC.
// Notes:
// - Prefer stable, public URLs (avoid /joined/ if possible).
// - Keep to high-confidence brands/communities with real Whop pages.
const items = [
  // Agency / AI
  { handle: 'solvra-6098', url: 'https://whop.com/discover/solvra-6098/', category: 'Agency' },
  { handle: 'agency00', url: 'https://whop.com/discover/agency00/', category: 'Agency' },
  { handle: 'aiagentcontentcreator', url: 'https://whop.com/discover/aiagentcontentcreator/', category: 'Agency' },
  { handle: 'ai-automation-agency-78', url: 'https://whop.com/discover/ai-automation-agency-78/', category: 'Agency' },

  // Content rewards (treat as clipping)
  { handle: 'content-rewards', url: 'https://whop.com/discover/content-rewards/', category: 'Clipping' },
  { handle: 'content-rewards-accelerator', url: 'https://whop.com/discover/content-rewards-accelerator/content-rewards-accelerator-10/', category: 'Clipping' },

  // Sports betting
  { handle: 'pm-picks', url: 'https://whop.com/discover/pm-picks/', category: 'Sports Betting' },
  { handle: 'richforeverbets', url: 'https://whop.com/discover/richforeverbets/', category: 'Sports Betting' },
  { handle: 'mcsports', url: 'https://whop.com/discover/mcsports/', category: 'Sports Betting' },
  { handle: 'lightning-locks', url: 'https://whop.com/discover/lightning-locks/', category: 'Sports Betting' },
];

let inserted = 0;
let skipped = 0;
const insertedHandles = [];

for (const it of items) {
  const handle = (it.handle || '').toLowerCase().trim();
  if (!handle) continue;

  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) {
    skipped++;
    continue;
  }

  const id = cuid();
  const ts = now();
  const name = handle.replace(/-/g, ' ');

  db.prepare(
    `INSERT INTO gurus (
      id, name, handle, category, bio, whop_url, whop_synced_at,
      creator_name, brand_name,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    handle,
    it.category || 'Whop',
    null,
    it.url,
    null,
    null,
    name,
    ts,
    ts
  );

  inserted++;
  insertedHandles.push(handle);
  console.log('Inserted', handle, it.url);
}

console.log(JSON.stringify({ inserted, skipped, insertedHandles }, null, 2));
