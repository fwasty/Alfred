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
  { handle: 'moon-market', name: 'Moon Market', category: 'Trading', whop_url: 'https://whop.com/discover/moon-market/' },
  { handle: 'iamtrading', name: 'I AM Trading', category: 'Trading', whop_url: 'https://whop.com/discover/iamtrading/i-am-trading/' },

  // Ecom / Dropshipping
  { handle: 'ecom-experts2', name: 'Ecom Experts', category: 'Ecom', whop_url: 'https://whop.com/discover/ecom-experts2/' },
  { handle: 'branded-dropshipping', name: 'Branded Dropshipping', category: 'Ecom', whop_url: 'https://whop.com/discover/branded-dropshipping/' },
  { handle: 'inner-circle-by-ddm', name: 'Inner Circle by DDM', category: 'Ecom', whop_url: 'https://whop.com/discover/inner-circle-by-ddm/digital-dropshipping-mastery/' },

  // Agency / AI Automation
  { handle: 'the-agency-playbook', name: 'The Agency Playbook', category: 'Agency', whop_url: 'https://whop.com/discover/the-agency-playbook/' },
  { handle: 'argus-ai-automation-academy', name: 'AI Automation Academy (Argus)', category: 'Agency', whop_url: 'https://whop.com/discover/argus-ai-automation-academy/' },
  { handle: 'upfish-automations', name: 'Upfish Automations', category: 'Agency', whop_url: 'https://whop.com/discover/upfish-automations/' },
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
