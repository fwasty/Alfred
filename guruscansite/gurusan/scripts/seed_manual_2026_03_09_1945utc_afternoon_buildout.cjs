const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() { return crypto.randomUUID().replace(/-/g,''); }
function now() { return Date.now(); }

// Manual buildout (2026-03-09 19:45 UTC)
// Seed high-confidence brands/communities with confirmed Whop pages.
// NOTE: /api/whop/sync expects *company* URLs (e.g. https://whop.com/<route>/), not /discover/ product pages.
const items = [
  // From Whop "online business courses" list (Whop blog)
  { handle: 'herlastcall', whop_url: 'https://whop.com/herlastcall/', category: 'Business' },
  { handle: 'tiktok-shop-course-discord', whop_url: 'https://whop.com/tiktok-shop-course-discord/', category: 'Business' },
  { handle: 'gamechanger', whop_url: 'https://whop.com/gamechanger/', category: 'Business' },
  { handle: 'lionsden', whop_url: 'https://whop.com/lionsden/', category: 'Business' },
  { handle: 'wepreneurs', whop_url: 'https://whop.com/wepreneurs/', category: 'Business' },
  { handle: 'kxvi-sonix-academy', whop_url: 'https://whop.com/kxvi-sonix-academy/', category: 'Business' },
  { handle: 'magnates', whop_url: 'https://whop.com/magnates/', category: 'Business' },
  { handle: 'ecom-degree-uni', whop_url: 'https://whop.com/ecom-degree-uni/', category: 'Business' },
  { handle: 'bgr-full-coaching-community', whop_url: 'https://whop.com/bgr-full-coaching-community/', category: 'Business' },
  { handle: 'baddies-in-business', whop_url: 'https://whop.com/baddies-in-business/', category: 'Business' },

  // Additional futures/trading discovery (new locally)
  { handle: 'e-minimaverick-ebook', whop_url: 'https://whop.com/e-minimaverick-ebook/', category: 'Trading' },
  { handle: 'the-golden-edge-futures', whop_url: 'https://whop.com/the-golden-edge-futures/', category: 'Trading' },
];

const insert = db.prepare(
  `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let inserted = 0;
for (const it of items) {
  const handle = String(it.handle || '').trim().toLowerCase();
  if (!handle) continue;
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if (existing) continue;

  const id = cuid();
  const ts = now();
  insert.run(
    id,
    handle.replace(/-/g, ' '),
    handle,
    it.category || 'Whop',
    null,
    it.whop_url,
    null,
    ts,
    ts
  );

  inserted++;
  console.log('Inserted', handle, it.whop_url);
}

console.log('Done. New gurus inserted:', inserted);
