const Database = require('better-sqlite3');
const crypto = require('crypto');

function cuid(){ return crypto.randomUUID().replace(/-/g,''); }
function now(){ return Date.now(); }

const db = new Database(process.env.SQLITE_PATH || 'gurusan.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS creators (
    id TEXT PRIMARY KEY,
    name TEXT,
    slug TEXT UNIQUE,
    bio TEXT,
    image_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    youtube_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    hidden INTEGER
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS creator_aliases (
    id TEXT PRIMARY KEY,
    creator_id TEXT,
    alias TEXT,
    created_at INTEGER,
    UNIQUE(creator_id, alias)
  );
`);

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

// 2026-03-10 batch (12 web_search call budget; conservative; only high-confidence matches)
// Sources used:
// - Divine: Whop plan page lists socials (@Divine_IO, @DivineResell, @Divinereselll) + Whop blog says led by Casey Woodward.
// - KingCapSports: Whop discover references IG @kingcap702 + X @kingcapsports_.
// - Hold My Hand Wholesale: Whop blog says led by Richard Taylor; IG @richardgrandintaylor; TikTok @hold_my_hand_wholesale.
// - Beat The Books: IG @beatthebookss referenced by Whop marketplace.
// - Pro Sports Advice: IG @prosportsadviceltd linked from Whop listing.
// - Profit Lounge: IG @profit_lounge and X @profit_lounge (brand/team).

const enrichments = [
  {
    creator: {
      slug: 'casey-woodward-divine',
      name: 'Casey Woodward (Divine)',
      bio: 'Founder/lead behind Divine (reselling community on Whop).',
      instagram_url: 'https://www.instagram.com/divineresell/',
      twitter_url: 'https://x.com/Divine_IO',
      tiktok_url: 'https://www.tiktok.com/@divinereselll',
      website_url: 'https://whop.com/divine/',
      image_url: 'https://unavatar.io/instagram/divineresell'
    },
    aliases: ['divine', 'divine resell', 'divineresell', 'divinereselll', 'divine_io', 'casey woodward'],
    guruHandles: ['divine']
  },
  {
    creator: {
      slug: 'kingcap702',
      name: 'KingCap702 (KingCapSports)',
      instagram_url: 'https://www.instagram.com/kingcap702/',
      twitter_url: 'https://x.com/kingcapsports_',
      website_url: 'https://whop.com/kingcapsports/',
      image_url: 'https://unavatar.io/instagram/kingcap702'
    },
    aliases: ['kingcapsports', 'king cap sports', 'kingcap702', 'kingcapsports_'],
    guruHandles: ['kingcap-clips-1']
  },
  {
    creator: {
      slug: 'richard-taylor-hmhw',
      name: 'Richard Taylor (Hold My Hand Wholesale)',
      bio: 'Real estate wholesaling educator; leads Hold My Hand Wholesale.',
      instagram_url: 'https://www.instagram.com/richardgrandintaylor/',
      tiktok_url: 'https://www.tiktok.com/@hold_my_hand_wholesale',
      website_url: 'https://whop.com/hold-my-hand-wholesale/',
      image_url: 'https://unavatar.io/instagram/richardgrandintaylor'
    },
    aliases: ['hold my hand wholesale', 'holdmyhandwholesale', 'hmhw', 'richard taylor', 'richardgrandintaylor', 'hold_my_hand_wholesale'],
    guruHandles: ['hold-my-hand-wholesale']
  },
  {
    creator: {
      slug: 'beat-the-books',
      name: 'Beat The Books',
      instagram_url: 'https://www.instagram.com/beatthebookss/',
      website_url: 'https://whop.com/beat-the-books/',
      image_url: 'https://unavatar.io/instagram/beatthebookss'
    },
    aliases: ['beat the books', 'beatthebookss', 'beat-the-books'],
    guruHandles: ['beat-the-books']
  },
  {
    creator: {
      slug: 'pro-sports-advice',
      name: 'Pro Sports Advice',
      instagram_url: 'https://www.instagram.com/prosportsadviceltd/',
      website_url: 'https://whop.com/pro-sports-advice/',
      image_url: 'https://unavatar.io/instagram/prosportsadviceltd'
    },
    aliases: ['pro sports advice', 'prosportsadviceltd', 'psa sports advice'],
    guruHandles: ['elite-vip-membership']
  },
  {
    creator: {
      slug: 'profit-lounge',
      name: 'Profit Lounge',
      instagram_url: 'https://www.instagram.com/profit_lounge/',
      twitter_url: 'https://x.com/profit_lounge',
      website_url: 'https://whop.com/profitlounge/',
      image_url: 'https://unavatar.io/instagram/profit_lounge'
    },
    aliases: ['profit lounge', 'profitlounge', 'profit_lounge'],
    guruHandles: ['profitlounge']
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
