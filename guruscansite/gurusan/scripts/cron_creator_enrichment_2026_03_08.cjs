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
  db.prepare(
    `INSERT OR IGNORE INTO creator_aliases (id, creator_id, alias, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(cuid(), creatorId, String(alias).toLowerCase().trim(), ts);
}

function setGuruCreator(guruHandle, creatorId){
  const ts = now();
  const g = db.prepare('SELECT id FROM gurus WHERE handle = ? LIMIT 1').get(guruHandle);
  if (!g) throw new Error(`Guru not found: ${guruHandle}`);
  db.prepare('UPDATE gurus SET creator_id = ?, updated_at = ? WHERE id = ?').run(creatorId, ts, g.id);
}

// 2026-03-08 batch (small + conservative).
// High-confidence sources used:
// - Whop blog: Bravo Six Picks founded by veteran brothers Sammy & Jay Pedro
// - IG/X/YouTube search results for Jdub Trades (Jack) and SecuredPicks (Tyson)
// - Prior enrichment record already in DB: Divine -> Casey Woodard; KingCapSports -> Anthony Mann

const enrichments = [
  // Divine -> Casey Woodard (ensure guru points to real creator profile)
  {
    creator: {
      slug: 'casey-woodard',
      name: 'Casey Woodard',
      bio: 'Founder/lead of Divine (reselling / ecom community on Whop).',
      twitter_url: 'https://x.com/thecaseywoodard',
      website_url: 'https://whop.com/discover/divine/',
      image_url: 'https://unavatar.io/twitter/thecaseywoodard'
    },
    aliases: ['divine', 'divineresell', 'casey woodard', 'thecaseywoodard'],
    guruHandles: ['divine']
  },

  // KingCapSports -> Anthony Mann (ensure guru points to real creator profile)
  {
    creator: {
      slug: 'anthony-mann',
      name: 'Anthony Mann',
      bio: 'Sports betting analyst; founder of KingCapSports (aka KingCap702).',
      instagram_url: 'https://www.instagram.com/kingcap702/',
      website_url: 'https://whop.com/discover/kingcapsports/',
      image_url: 'https://unavatar.io/instagram/kingcap702'
    },
    aliases: ['kingcapsports', 'kingcap', 'kingcap702', 'anthony mann'],
    guruHandles: ['kingcap-clips-1']
  },

  // Bravo Six Picks -> Sammy & Jay Pedro (team)
  {
    creator: {
      slug: 'sammy-jay-pedro',
      name: 'Sammy & Jay Pedro',
      bio: 'Veteran brothers; founders of Bravo Six Picks sports betting community on Whop.',
      instagram_url: 'https://www.instagram.com/bravosixpicks/',
      website_url: 'https://linktr.ee/bravosixpicks',
      image_url: 'https://unavatar.io/instagram/bravosixpicks'
    },
    aliases: ['bravo six picks', 'bravosixpicks', 'sammy pedro', 'jay pedro'],
    guruHandles: ['bravosixpicks']
  },

  // Jdub Trades -> Jack
  {
    creator: {
      slug: 'jack-jdub-trades',
      name: 'Jack (Jdub Trades)',
      bio: 'Options/Futures trader; runs Jdub Trades community on Whop.',
      instagram_url: 'https://www.instagram.com/jdub_trades/',
      twitter_url: 'https://x.com/jdubtrades_',
      website_url: 'https://whop.com/jdubtrades/',
      image_url: 'https://unavatar.io/instagram/jdub_trades'
    },
    aliases: ['jdub trades', 'jdubtrades', 'jdub_trades', 'jdubtrades_', 'jack jdub'],
    guruHandles: ['discord-access-f7']
  },

  // SecuredPicks -> Tyson (SecuredTyson)
  {
    creator: {
      slug: 'tyson-securedpicks',
      name: 'Tyson (SecuredPicks)',
      bio: 'Founder of SecuredPicks sports betting community (aka SecuredTyson).',
      instagram_url: 'https://www.instagram.com/securedtys/',
      youtube_url: 'https://www.youtube.com/@SecuredTyson',
      twitter_url: 'https://x.com/securedpicks',
      website_url: 'https://whop.com/marketplace/securedpicks/',
      image_url: 'https://unavatar.io/instagram/securedtys'
    },
    aliases: ['securedpicks', 'secured picks', 'tyson securedpicks', 'securedtyson', 'securedtys', '@securedtys', '@securedpicks'],
    guruHandles: ['securedpicks']
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
