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

// Manual seed adds for 2026-03-10 09:45 UTC
// Sourced from high-confidence Whop discover pages surfaced via search.
const seeds = [
  { handle: 'the-academy-e1', name: 'The Academy', category: 'Marketing', whop_url: 'https://whop.com/discover/the-academy-e1/' },
  { handle: 'the-agency-playbook', name: 'The Agency Playbook', category: 'Marketing', whop_url: 'https://whop.com/discover/the-agency-playbook/' },
  { handle: 'ofmempire', name: 'OFM Empire VIP', category: 'Business', whop_url: 'https://whop.com/discover/btz/ofmempire/' },
  { handle: 'agency-insiders', name: 'Agency Insiders', category: 'Marketing', whop_url: 'https://whop.com/discover/agency-insiders-pro/agency-insiders/' },
  { handle: 'asl', name: "Eddie's Agency Secret Letters", category: 'Marketing', whop_url: 'https://whop.com/discover/agency-domain/asl/' },
  { handle: 'agencyannoyed', name: 'Agency 1.0', category: 'Design', whop_url: 'https://whop.com/discover/agencyannoyed/' },
];

for (const s of seeds) {
  const existing = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(s.handle);
  if (existing) {
    db.prepare(
      'UPDATE gurus SET whop_url = COALESCE(?, whop_url), category = COALESCE(?, category), name = COALESCE(?, name), updated_at = ? WHERE handle = ?'
    ).run(s.whop_url, s.category, s.name, now(), s.handle);
    console.log('Updated', s.handle);
    continue;
  }
  const id = cuid();
  const ts = now();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, whop_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, s.name, s.handle, s.category, null, s.whop_url, null, ts, ts);
  console.log('Inserted', s.handle);
}
