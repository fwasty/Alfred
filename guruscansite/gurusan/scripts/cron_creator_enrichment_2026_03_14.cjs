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

// 2026-03-14 nightly enrichment
// Web_search budget used (12 total): TrustMySystem, Crypto Inside Bets, KingCapSports, PJ Trades, GoldBoys, PB Trading
// + Instagram/handle confirmations for TrustMySystem, PJ Trades, GoldBoys, PB Blake, Anthony Mann.
// Conservative policy: only apply changes when the match is very likely.

const enrichments = [
  // Relinks to previously enriched creators (zero new web_search required)
  {
    creatorSlug: 'casey-woodward-divine',
    aliases: ['divine', 'divineresell', 'divinereselll', 'divine_io', 'casey woodward'],
    guruHandles: ['divine']
  },
  {
    creatorSlug: 'apollo-school-of-gods',
    aliases: ['school of gods', 'schoolofgods', 'apollo', 'apollothegreekgod_'],
    guruHandles: ['schoolofgods', 'schoolofgods-paid']
  },
  {
    creatorSlug: 'nick-emoney',
    aliases: ['emoney', 'e money', 'nick from emoney', 'emoney_resell'],
    guruHandles: ['emoney']
  },
  {
    creatorSlug: 'hidden-society-trading',
    aliases: ['hidden society', 'hidden society trading', 'hiddensociety', 'ahiddensociety'],
    guruHandles: ['hidden-trading']
  },
  {
    creatorSlug: 'kingcap702',
    aliases: ['kingcapsports', 'king cap sports', 'kingcap702', 'kingcapsports_'],
    guruHandles: ['kingcap-clips-1']
  },
  {
    creatorSlug: 'richard-taylor-hmhw',
    aliases: ['hold my hand wholesale', 'holdmyhandwholesale', 'hmhw', 'richard taylor', 'richardgrandintaylor', 'hold_my_hand_wholesale'],
    guruHandles: ['hold-my-hand-wholesale']
  },
  {
    creatorSlug: 'profit-lounge',
    aliases: ['profit lounge', 'profitlounge', 'profit_lounge'],
    guruHandles: ['profitlounge']
  },
  {
    creatorSlug: 'beat-the-books',
    aliases: ['beat the books', 'beatthebookss', 'beat-the-books'],
    guruHandles: ['beat-the-books']
  },
  {
    creatorSlug: 'pro-sports-advice',
    aliases: ['pro sports advice', 'prosportsadviceltd', 'psa sports advice'],
    guruHandles: ['elite-vip-membership']
  },
  {
    creatorSlug: 'mysportpick',
    aliases: ['mysportpick', 'my sport pick', 'my sportpick'],
    guruHandles: ['mysportpick']
  },
  {
    creatorSlug: 'sean-sweeney-deal-soldier',
    aliases: ['deal soldier', 'deal_soldier', 'sean sweeney', 'superunsexy'],
    guruHandles: ['free-product-41']
  },
  {
    creatorSlug: 'tyson-nguyen-securedpicks',
    aliases: ['securedpicks', 'secured picks', 'tyson nguyen', 'securedtys'],
    guruHandles: ['securedpicks']
  },

  // New, high-confidence brand/team creator upgrades from today's web_search
  {
    creator: {
      slug: 'trust-my-system',
      name: 'Trust My System (TMS Sports Consulting LLC)',
      bio: 'Sports betting consulting/analytics brand on Whop (TrustMySystem).',
      image_url: 'https://unavatar.io/instagram/trustmysystem',
      instagram_url: 'https://www.instagram.com/trustmysystem/',
      website_url: 'https://trustmysystem.com/'
    },
    aliases: ['trust my system', 'trustmysystem', 'tms', 'tms sports consulting', 'tms sports consulting llc'],
    guruHandles: ['tms-plus']
  },
  {
    creator: {
      slug: 'paul-jon-siljee-jr-pj-trades',
      name: 'Paul Jon Siljee Jr. (PJ Trades)',
      bio: 'Futures day trader / mentor behind PJ Trades on Whop.',
      image_url: 'https://unavatar.io/instagram/pjtradesnq',
      instagram_url: 'https://www.instagram.com/pjtradesnq/',
      website_url: 'https://whop.com/pjtradespremium/pj-trade/'
    },
    aliases: ['pj trades', 'pjtrades', 'pjtradespremium', 'pjtradesofficial', 'pjtradesnq', 'paul jon siljee', 'paul jon siljee jr', 'marketmasterfx'],
    guruHandles: ['pjtradespremium']
  },
  {
    creator: {
      slug: 'goldboys',
      name: 'GoldBoys',
      bio: 'Large sports betting community/Discord on Whop.',
      image_url: 'https://unavatar.io/instagram/goldboysbetting',
      instagram_url: 'https://www.instagram.com/goldboysbetting/',
      twitter_url: 'https://x.com/GoldBoysBets',
      website_url: 'https://goldboys.com/'
    },
    aliases: ['goldboys', 'gold boys', 'goldboysbetting', 'goldboysbets'],
    guruHandles: ['goldboys']
  }
];

const changes = [];

const tx = db.transaction(() => {
  for (const e of enrichments) {
    let creator;

    if (e.creatorSlug) {
      creator = db.prepare('SELECT * FROM creators WHERE slug = ? LIMIT 1').get(e.creatorSlug);
      if (!creator) throw new Error(`Creator missing: ${e.creatorSlug}`);
    } else {
      creator = upsertCreator(e.creator);
    }

    for (const h of (e.guruHandles || [])) setGuruCreator(h, creator.id);
    for (const a of (e.aliases || [])) addCreatorAlias(creator.id, a);

    changes.push({ creator_slug: creator.slug, creator_name: creator.name, guruHandles: e.guruHandles || [] });
  }
});

tx();

console.log(JSON.stringify({ updated: changes.length, changes }, null, 2));
