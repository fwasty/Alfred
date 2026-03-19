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

function igHandle(url){
  if (!url) return null;
  const m = String(url).match(/instagram\.com\/([^/?#]+)/i);
  return m ? m[1] : null;
}

const enrichments = [
  // Whop (multiple top-review listings were missing socials)
  {
    guruHandles: ['ugc-factory', 'whop-clips', 'whop-affiliates'],
    creator: {
      slug: 'whop',
      name: 'Whop',
      bio: 'Marketplace for digital products, communities, and subscriptions.',
      instagram_url: 'https://www.instagram.com/whop/',
      twitter_url: 'https://x.com/whop',
      youtube_url: 'https://www.youtube.com/@WhopIO',
      website_url: 'https://whop.com/',
      image_url: 'https://unavatar.io/instagram/whop'
    },
    aliases: ['whop', 'whopio', '@whop', '@whopio']
  },

  // Official Picks
  {
    guruHandles: ['officialpicks'],
    creator: {
      slug: 'official-picks',
      name: 'Official Picks',
      bio: 'Sports betting picks and community.',
      instagram_url: 'https://www.instagram.com/officialpickss/',
      twitter_url: 'https://x.com/officialpickss',
      website_url: 'https://whop.com/officialpicks/',
      image_url: 'https://unavatar.io/instagram/officialpickss'
    },
    aliases: ['official picks', 'officialpicks', 'officialpickss', '@officialpickss']
  },

  // ClipIt / SERVIUOS
  {
    guruHandles: ['clipit'],
    creator: {
      slug: 'clipit',
      name: 'SERVIUOS (ClipIt)',
      bio: 'Creator behind ClipIt on Whop.',
      instagram_url: 'https://www.instagram.com/serviuos/',
      website_url: 'https://www.serviuos.com/',
      image_url: 'https://unavatar.io/instagram/serviuos'
    },
    aliases: ['clipit', 'serviuos', '@serviuos', 'clipitnew']
  },
];

const tx = db.transaction(() => {
  for (const e of enrichments) {
    const creator = upsertCreator(e.creator);
    for (const h of (e.guruHandles || [])) setGuruCreator(h, creator.id);
    for (const a of (e.aliases || [])) addCreatorAlias(creator.id, a);
    const h = igHandle(creator.instagram_url);
    if (h) addCreatorAlias(creator.id, h);
  }
});

tx();

const changed = [];
for (const e of enrichments) {
  const creator = db.prepare('SELECT id, slug, name, instagram_url, tiktok_url, youtube_url, twitter_url, website_url, image_url FROM creators WHERE slug = ?').get(e.creator.slug);
  for (const handle of e.guruHandles) {
    const g = db.prepare('SELECT handle, name, creator_id FROM gurus WHERE handle = ?').get(handle);
    changed.push({ guru: g, creator });
  }
}

console.log(JSON.stringify({ updated: changed.length, changed }, null, 2));
