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
  { handle: 'masterthemarket', name: 'Master the Market', category: 'Trading', whop_url: 'https://whop.com/discover/masterthemarket/mastering-market-mentorships/' },
  { handle: 'alpha-trading-mentorship', name: 'Alpha Trading Mentorship', category: 'Trading', whop_url: 'https://whop.com/discover/alpha-trading-mentorship/' },
  { handle: 'thetradingacademy', name: 'The Trading Academy', category: 'Trading', whop_url: 'https://whop.com/discover/thetradingacademy/mentorshiptta/' },

  // Ecom
  { handle: 'ecom-masterclass-101', name: 'Ecom Masterclass', category: 'Ecom', whop_url: 'https://whop.com/discover/ecom-masterclass-101/' },
  { handle: 'proper-ecom-academy-97', name: 'Proper Ecom Academy', category: 'Ecom', whop_url: 'https://whop.com/discover/proper-ecom-academy-97/' },
  { handle: 'authentic-ecom', name: 'The Real Ecom', category: 'Ecom', whop_url: 'https://whop.com/discover/authentic-ecom/' },
  { handle: 'the-ecom-mind-free', name: 'The Ecom Mind (Free)', category: 'Ecom', whop_url: 'https://whop.com/discover/the-ecom-mind-free/' },

  // AI
  { handle: 'argus-ai-automation-academy', name: 'AI Automation Academy', category: 'AI', whop_url: 'https://whop.com/discover/argus-ai-automation-academy/' },
  { handle: 'awa', name: 'AI Wealth Academy', category: 'AI', whop_url: 'https://whop.com/discover/awa/' },
  { handle: 'ai-insiders1', name: 'AI Insiders', category: 'AI', whop_url: 'https://whop.com/discover/ai-insiders1/ai-insiders-community/' },
  { handle: 'luminary-legionnaire-sub', name: 'Luminary AI Community', category: 'AI', whop_url: 'https://whop.com/discover/luminary-legionnaire-sub/luminary/' },

  // Sports Betting
  { handle: 'swt', name: 'SWT Sports VIP', category: 'Sports Betting', whop_url: 'https://whop.com/discover/swt/' },
  { handle: 'magic-bets', name: 'Magic Bets', category: 'Sports Betting', whop_url: 'https://whop.com/discover/magic-bets/' },
  { handle: 'royalpicks', name: 'Royal Picks', category: 'Sports Betting', whop_url: 'https://whop.com/discover/royalpicks/' },
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
