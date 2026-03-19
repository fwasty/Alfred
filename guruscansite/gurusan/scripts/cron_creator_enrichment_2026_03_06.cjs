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
  if (!alias) return;
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

const enrichments = [
  // Elite Options Trader
  {
    creator: {
      slug: 'elite-options',
      name: 'Elite Options Trader',
      bio: 'Options trading community (Elite Options).',
      twitter_url: 'https://x.com/eliteoptions2',
      instagram_url: 'https://www.instagram.com/eliteoptionstrader2/',
      tiktok_url: 'https://www.tiktok.com/@eliteoptionstrader',
      website_url: 'https://whop.com/elite-options/',
      image_url: 'https://unavatar.io/instagram/eliteoptionstrader2'
    },
    aliases: ['elite options', 'eliteoptionstrader', 'eliteoptions2', '@eliteoptions2', '@eliteoptionstrader2'],
    guruHandles: ['elite-options']
  },

  // PB Trading
  {
    creator: {
      slug: 'pbtrading',
      name: 'PB Trading (Blake + Patrick)',
      bio: 'Trading education + community by Blake and Patrick.',
      instagram_url: 'https://www.instagram.com/officialpbtrading/',
      website_url: 'https://whop.com/pbtrading/',
      image_url: 'https://unavatar.io/instagram/officialpbtrading'
    },
    aliases: ['pb trading', 'pbtrading', 'officialpbtrading', '@officialpbtrading'],
    guruHandles: ['pbtrading']
  },

  // Tempo Trades
  {
    creator: {
      slug: 'tempotrades',
      name: 'Tempo Trades',
      bio: 'Futures trader and mentor (Tempo).',
      instagram_url: 'https://www.instagram.com/tempoict/',
      tiktok_url: 'https://www.tiktok.com/@tempotrades',
      website_url: 'https://whop.com/tempotrades/',
      image_url: 'https://unavatar.io/instagram/tempoict'
    },
    aliases: ['tempotrades', 'tempo trades', 'tempoict', '@tempoict', '@tempotrades'],
    guruHandles: ['tempotrades']
  },

  // Dodgy's Dungeon
  {
    creator: {
      slug: 'dodgys-dungeon',
      name: 'Dodgy',
      bio: 'Trader specializing in ICT concepts (Dodgy\'s Dungeon).',
      twitter_url: 'https://x.com/dodgysdd',
      website_url: 'https://whop.com/dodgys-dungeon/',
      image_url: 'https://unavatar.io/twitter/dodgysdd'
    },
    aliases: ['dodgys dungeon', "dodgy's dungeon", 'dodgysdd', '@dodgysdd'],
    guruHandles: ['dodgys-dungeon']
  },

  // Potion Alpha
  {
    creator: {
      slug: 'potion-alpha',
      name: 'Potion Alpha (Orangie)',
      bio: 'Crypto trading community/platform founded by Orangie.',
      twitter_url: 'https://x.com/potionalpha',
      website_url: 'https://whop.com/potion-alpha/',
      image_url: 'https://unavatar.io/twitter/potionalpha'
    },
    aliases: ['potion alpha', 'potionalpha', '@potionalpha', 'orangie'],
    guruHandles: ['potion-alpha']
  },

  // Brez Marketing
  {
    creator: {
      slug: 'brez-marketing',
      name: 'Brez (Bergen Resnick)',
      bio: 'Founder of Brez Marketing.',
      instagram_url: 'https://www.instagram.com/brezscales/',
      website_url: 'https://whop.com/brez-marketing/',
      image_url: 'https://unavatar.io/instagram/brezscales'
    },
    aliases: ['brez marketing', 'brez', 'bergen resnick', 'brezscales', '@brezscales'],
    guruHandles: ['brez-marketing']
  },

  // Shinobi Signals (Traders Blueprint)
  {
    creator: {
      slug: 'shinobi-signals',
      name: 'Shinobi Signals',
      bio: 'Trading educator/community (Traders Blueprint).',
      website_url: 'https://whop.com/marketplace/shinobi-signals/'
    },
    aliases: ['shinobi signals', 'shinobisignals', '@shinobisignals', 'traders blueprint'],
    guruHandles: ['shinobi-signals']
  },

  // Whop (ensure key Whop program listings are linked to Whop creator)
  {
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
    aliases: ['whop', 'whopio', '@whop', '@whopio', 'content rewards'],
    guruHandles: ['content-rewards-campaigns', 'content-rewards-discovery', 'whop-clips', 'whop-affiliates', 'ugc-factory']
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
