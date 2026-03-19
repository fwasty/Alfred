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

// New additions discovered via conservative Whop Discover searches (only resolvable /discover pages).
// Goal: add popular brands/courses across Trading + Ecom + AI + Marketing (+ a couple content-rewards / clipping style pages).
const seeds = [
  // Trading
  { handle: 'moontrades', name: 'Moon Trades', category: 'Trading', whop_url: 'https://whop.com/discover/moontrades/' },

  // Ecom
  { handle: 'ecom-masterclass-101', name: 'THE ECOM MASTERCLASS', category: 'Ecom', whop_url: 'https://whop.com/discover/ecom-masterclass-101/' },
  { handle: 'e-commercebuilders', name: 'E-Commerce Builders', category: 'Ecom', whop_url: 'https://whop.com/discover/e-commercebuilders/' },
  { handle: 'the-ecom-mind-free', name: 'The Ecom Mind (Free)', category: 'Ecom', whop_url: 'https://whop.com/discover/the-ecom-mind-free/' },
  { handle: 'free-ecom-club', name: 'Free Ecom Club', category: 'Ecom', whop_url: 'https://whop.com/discover/free-ecom-club/' },
  { handle: 'ecom-tools', name: 'Ecom Tools', category: 'Ecom', whop_url: 'https://whop.com/discover/ecom-tools/' },

  // Marketing / misc
  { handle: 'na142i5i25i25', name: 'AgencySecrets', category: 'Marketing', whop_url: 'https://whop.com/discover/na142i5i25i25/agencysecrets/' },
  { handle: '5-star-reviews', name: '5 Star Reviews', category: 'Marketing', whop_url: 'https://whop.com/discover/5-star-reviews/' },

  // AI
  { handle: 'clippie-ai', name: 'Clippie AI', category: 'AI', whop_url: 'https://whop.com/discover/clippie-ai/' },
  { handle: 'ai-basics-course', name: 'AI Basics Course', category: 'AI', whop_url: 'https://whop.com/discover/ai-basics-course/' },

  // Content rewards (treat as clipping section per project convention)
  { handle: 'aiwrita', name: 'AI Writa (Content Rewards)', category: 'Clipping', whop_url: 'https://whop.com/discover/aiwrita/' },
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
