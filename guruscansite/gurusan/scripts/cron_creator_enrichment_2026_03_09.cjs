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

// 2026-03-09 batch (max 12 web_search calls; conservative; only high-confidence matches).
// Sources used (high confidence):
// - EmmanuelTrades: IG emtradezz; X emmanueltradez; TikTok emanueltrades; website emmanueltrades.com
// - BetBigBen: IG betbigben; X betbigben
// - TomTrades: Whop shows Tom Gratwicke @itstomtrades; IG itstomtrades
// - The Traveling Trader: Whop blog mentions founder known as "Zee"; IG thetravel1ngtrader; website thetravelingtrader.com; YT channel UCWt3Cx6RrHX86_yF4I7f1LA

const enrichments = [
  {
    creator: {
      slug: 'emmanueltrades',
      name: 'Emmanuel Malyarovich (EmmanuelTrades)',
      instagram_url: 'https://www.instagram.com/emtradezz/',
      twitter_url: 'https://x.com/emmanueltradez',
      tiktok_url: 'https://www.tiktok.com/@emanueltrades',
      website_url: 'https://www.emmanueltrades.com/'
    },
    aliases: ['emmanueltrades', 'emtradezz', 'emmanueltradez', 'emanueltrades', 'emmanuel trades'],
    guruHandles: ['emmanueltrades']
  },
  {
    creator: {
      slug: 'betbigben',
      name: 'Ben (BetBigBen)',
      instagram_url: 'https://www.instagram.com/betbigben/',
      twitter_url: 'https://x.com/betbigben',
      website_url: 'https://whop.com/betbigben/'
    },
    aliases: ['betbigben', 'bet big ben', 'ben betbigben'],
    guruHandles: ['betbigben']
  },
  {
    creator: {
      slug: 'itstomtrades',
      name: 'Tom Gratwicke (TomTrades)',
      instagram_url: 'https://www.instagram.com/itstomtrades/',
      website_url: 'https://whop.com/itstomtrades/'
    },
    aliases: ['itstomtrades', 'tom gratwicke', 'tomtrades', 'tom trades'],
    guruHandles: ['itstomtrades']
  },
  {
    creator: {
      slug: 'zee-the-traveling-trader',
      name: 'Zee (The Traveling Trader)',
      bio: 'Founder/host of The Traveling Trader trading community.',
      instagram_url: 'https://www.instagram.com/thetravel1ngtrader/',
      youtube_url: 'https://www.youtube.com/channel/UCWt3Cx6RrHX86_yF4I7f1LA',
      website_url: 'https://www.thetravelingtrader.com/',
      image_url: 'https://unavatar.io/instagram/thetravel1ngtrader'
    },
    aliases: ['the traveling trader', 'thetravelingtrader', 'zee', 'thetravel1ngtrader'],
    guruHandles: ['thetravelingtrader', 'premium-discord-access-1f', 'premium-discord-access-5f']
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
