const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// 2026-03-13 01:45 UTC — discovered via conservative web_search (confirmed Whop discover pages).
// Goal: add high-confidence brands/communities, then sync via /api/whop/sync.
// NOTE: For /discover/<brand>/<product>/ we prefer <brand> as the local handle so multiple offers map to one creator.
const seeds = [
  { handle: 'futures-trading-mentorship', name: 'Futures Trading Mentorship', category: 'Trading', whop_url: 'https://whop.com/discover/futures-trading-mentorship/' },
  { handle: '1-on-1-mentoring-62', name: '1-on-1 Mentoring', category: 'Trading', whop_url: 'https://whop.com/discover/1-on-1-mentoring-62/' },
  { handle: 'ultimate-trading-mentorship-87', name: 'Ultimate Trading Mentorship', category: 'Trading', whop_url: 'https://whop.com/discover/ultimate-trading-mentorship-87/ultimate-trading-mentorship/' },
  { handle: 'carlos-futures-starter-copy', name: 'Carlos Futures', category: 'Trading', whop_url: 'https://whop.com/discover/carlos-futures-starter-copy/carlos-futures-mentorship/' },
  { handle: 'cowboyfx', name: 'CowboyFX', category: 'Trading', whop_url: 'https://whop.com/discover/cowboyfx/mentorship-access-d6/' },

  { handle: 'pinnacle-trades-vip-discord', name: 'Pinnacle Trades', category: 'Trading', whop_url: 'https://whop.com/discover/pinnacle-trades-vip-discord/pinnacle-trades-lifetime-discord/' },
  { handle: 'discord-vip-2b', name: 'Discord VIP (TSM Community)', category: 'Trading', whop_url: 'https://whop.com/discover/discord-vip-2b/' },
  { handle: 'iblvtradingvip', name: 'IBLV Trading VIP', category: 'Trading', whop_url: 'https://whop.com/discover/iblvtradingvip/' },
  { handle: 'discord-30-days-vip-access', name: 'Forextasy Makers VIP Access', category: 'Trading', whop_url: 'https://whop.com/discover/discord-30-days-vip-access/' },
  { handle: 'vip-discord-access-0d', name: 'Voss Trading VIP Yearly', category: 'Trading', whop_url: 'https://whop.com/discover/vip-discord-access-0d/' },
  { handle: 'peak-capital-traders', name: 'Peak Capital Traders VIP', category: 'Trading', whop_url: 'https://whop.com/discover/peak-capital-traders/' },

  { handle: 'masterdaytrading', name: 'Master Day Trading', category: 'Trading', whop_url: 'https://whop.com/discover/masterdaytrading/masterdaytrading-mentorship-program/' },
];

let inserted = 0;
let updated = 0;

const tx = db.transaction(() => {
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
      `INSERT INTO gurus (
        id, name, handle, category, bio, whop_url, whop_synced_at,
        creator_name, brand_name,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      s.name,
      s.handle,
      s.category,
      null,
      s.whop_url,
      null,
      null,
      s.name,
      ts,
      ts
    );
    console.log('Inserted', s.handle, '->', s.whop_url);
    inserted++;
  }
});

tx();
console.log(JSON.stringify({ inserted, updated, total: seeds.length }, null, 2));
