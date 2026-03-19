const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() {
  return crypto.randomUUID().replace(/-/g, '');
}
function now() {
  return Date.now();
}

// Sources: Whop blog list "Top 23 best dropshipping Discord Servers [March 2026]"
// https://whop.com/blog/top-dropshipping-discord-servers/
const seeds = [
  { handle: 'ecom-guild', name: 'The Ecom Guild', category: 'E-Commerce', whop_url: 'https://whop.com/discover/ecom-guild/' },
  { handle: 'ecomparadiseep', name: 'Ecom Paradise', category: 'E-Commerce', whop_url: 'https://whop.com/discover/ecomparadiseep/' },
  { handle: 'rippy-club', name: 'Rippy Club', category: 'E-Commerce', whop_url: 'https://whop.com/discover/rippy-club/' },
  { handle: 'permill', name: 'Per Mill', category: 'E-Commerce', whop_url: 'https://whop.com/discover/permill/' },
  { handle: 'sigmaboys-e-commerce', name: 'SigmaBoys E-Commerce', category: 'E-Commerce', whop_url: 'https://whop.com/discover/sigmaboys-e-commerce/' },
  { handle: 'luxecomacademy-s-whop', name: 'Lux Ecom Academy Dropshipping Accelerator', category: 'E-Commerce', whop_url: 'https://whop.com/discover/luxecomacademy-s-whop/' },
  { handle: 'depop-inner-circle', name: 'Depop Inner Circle', category: 'E-Commerce', whop_url: 'https://whop.com/discover/depop-inner-circle/' },
  { handle: 'mavenport', name: 'Mavenport Hustler', category: 'E-Commerce', whop_url: 'https://whop.com/marketplace/mavenport/' },
];

let inserted = 0;
let updated = 0;

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare('UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), updated_at = ? WHERE handle = ?')
      .run(s.whop_url, s.category, now(), s.handle);
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

console.log(JSON.stringify({ inserted, updated, total: seeds.length }));
