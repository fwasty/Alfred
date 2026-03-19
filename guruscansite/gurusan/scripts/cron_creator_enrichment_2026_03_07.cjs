const Database = require('better-sqlite3');
const crypto = require('crypto');

function cuid(){ return crypto.randomUUID().replace(/-/g,''); }
function now(){ return Date.now(); }

const db = new Database(process.env.SQLITE_PATH || 'gurusan.db');
db.pragma('journal_mode = WAL');

function upsertCreator(input){
  const ts = now();
  const existing = db.prepare('SELECT * FROM creators WHERE slug = ? LIMIT 1').get(input.slug);
  if (existing) {
    db.prepare(
      `UPDATE creators
       SET name = COALESCE(?, name),
           bio = COALESCE(?, bio),
           image_url = COALESCE(?, image_url),
           instagram_url = COALESCE(?, instagram_url),
           tiktok_url = COALESCE(?, tiktok_url),
           youtube_url = COALESCE(?, youtube_url),
           twitter_url = COALESCE(?, twitter_url),
           website_url = COALESCE(?, website_url),
           updated_at = ?
       WHERE id = ?`
    ).run(
      input.name,
      input.bio ?? null,
      input.image_url ?? null,
      input.instagram_url ?? null,
      input.tiktok_url ?? null,
      input.youtube_url ?? null,
      input.twitter_url ?? null,
      input.website_url ?? null,
      ts,
      existing.id
    );
    return db.prepare('SELECT * FROM creators WHERE id = ?').get(existing.id);
  }

  const id = cuid();
  db.prepare(
    `INSERT INTO creators (id, name, slug, bio, image_url, instagram_url, tiktok_url, youtube_url, twitter_url, website_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.slug,
    input.bio ?? null,
    input.image_url ?? null,
    input.instagram_url ?? null,
    input.tiktok_url ?? null,
    input.youtube_url ?? null,
    input.twitter_url ?? null,
    input.website_url ?? null,
    ts,
    ts
  );
  return db.prepare('SELECT * FROM creators WHERE id = ?').get(id);
}

function addCreatorAlias(creatorId, alias){
  const ts = now();
  if (!alias) return;
  const id = cuid();
  db.prepare(
    `INSERT OR IGNORE INTO creator_aliases (id, creator_id, alias, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(id, creatorId, String(alias).toLowerCase().trim(), ts);
}

function setGuruCreator(guruHandle, creatorId){
  const ts = now();
  const g = db.prepare('SELECT id FROM gurus WHERE handle = ? LIMIT 1').get(guruHandle);
  if (!g) throw new Error(`Guru not found: ${guruHandle}`);
  db.prepare('UPDATE gurus SET creator_id = ?, updated_at = ? WHERE id = ?').run(creatorId, ts, g.id);
}

// This batch is intentionally small and conservative (web_search budget capped upstream).
// Sources used (high confidence):
// - Whop blog: Divine is led by Casey Woodard
// - Whop blog: KingCapSports founded by Anthony Mann; IG @KingCap702
// - Social handles discovered via search results for Official Picks, Wealth Group

const enrichments = [
  // Divine -> Casey Woodard
  {
    creator: {
      slug: 'casey-woodard',
      name: 'Casey Woodard',
      bio: 'Founder/lead of Divine (reselling / ecom community on Whop).',
      twitter_url: 'https://x.com/thecaseywoodard',
      website_url: 'https://whop.com/discover/divine/',
      image_url: 'https://unavatar.io/twitter/thecaseywoodard'
    },
    aliases: ['divine', 'divine resell', 'divineresell', '@divineresell', 'divine_io', '@divine_io', 'casey woodard', 'thecaseywoodard'],
    guruHandles: ['divine']
  },

  // KingCapSports -> Anthony Mann
  {
    creator: {
      slug: 'anthony-mann',
      name: 'Anthony Mann',
      bio: 'Sports betting analyst; founder of KingCapSports (aka KingCap702).',
      instagram_url: 'https://www.instagram.com/kingcap702/',
      website_url: 'https://whop.com/discover/kingcapsports/',
      image_url: 'https://unavatar.io/instagram/kingcap702'
    },
    aliases: ['kingcapsports', 'kingcap', 'kingcap702', '@kingcap702', 'anthony mann'],
    guruHandles: ['kingcap-clips-1']
  },

  // Official Picks (brand) -> enrich socials (no confident single person)
  {
    creator: {
      slug: 'officialpicks',
      name: 'Official Picks',
      bio: 'Sports picks/betting community (brand).',
      instagram_url: 'https://www.instagram.com/officialpickss/',
      twitter_url: 'https://x.com/officialpickss',
      website_url: 'https://linktr.ee/officialpicks',
      image_url: 'https://unavatar.io/instagram/officialpickss'
    },
    aliases: ['official picks', 'officialpicks', 'officialpickss', '@officialpickss'],
    guruHandles: ['officialpicks']
  },

  // Wealth Group (brand) -> enrich socials (founder not confidently identified)
  {
    creator: {
      slug: 'wealthgroup',
      name: 'Wealth Group (WG)',
      bio: 'Crypto trading community (brand).',
      twitter_url: 'https://x.com/wealthgroup',
      website_url: 'https://www.wealthgroup.ai/',
      image_url: 'https://unavatar.io/twitter/wealthgroup'
    },
    aliases: ['wealth group', 'wealthgroup', 'wg', 'wealthgroup_', '@wealthgroup', '@wealthgroup_'],
    guruHandles: ['wealthgroup']
  }
];

const changes = [];

const tx = db.transaction(() => {
  for (const e of enrichments) {
    const creator = upsertCreator(e.creator);
    for (const h of (e.guruHandles || [])) setGuruCreator(h, creator.id);
    for (const a of (e.aliases || [])) addCreatorAlias(creator.id, a);
    changes.push({ slug: creator.slug, name: creator.name, guruHandles: e.guruHandles || [] });
  }
});

tx();

console.log(JSON.stringify({ updated: changes.length, changes }, null, 2));
