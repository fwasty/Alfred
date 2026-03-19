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

// 2026-03-13 nightly enrichment
// Web_search budget: 12 calls max (conservative). New high-confidence findings used:
// - School of Gods: founder/face appears as "Apollo"; IG in YouTube desc: @apollothegreekgod_.
// - eMoney: Whop profile: "Nick from eMoney" + IG @emoney_resell.
// - Hidden Society: brand socials: IG @ahiddensociety, X @hiddensociety.
// - MySportPick: brand IG @mysportpick.
// - Deal Soldier: Whop blog cites Sean Sweeney; IG @superunsexy (bio: co-founder @deal_soldier).
// Also: relink several top-reviewed gurus from placeholder creators to already-enriched person/team creators created in earlier batches.

const enrichments = [
  // Relinks to existing enriched creators
  {
    creator: {
      slug: 'casey-woodward-divine',
      name: 'Casey Woodward (Divine)',
      image_url: 'https://unavatar.io/instagram/divineresell',
      instagram_url: 'https://www.instagram.com/divineresell/',
      twitter_url: 'https://x.com/Divine_IO',
      tiktok_url: 'https://www.tiktok.com/@divinereselll',
      website_url: 'https://whop.com/divine/'
    },
    aliases: ['divine', 'divineresell', 'divinereselll', 'divine_io', 'casey woodward'],
    guruHandles: ['divine']
  },
  {
    creator: {
      slug: 'tyson-nguyen-securedpicks',
      name: 'Tyson Nguyen (SecuredPicks)',
      image_url: 'https://unavatar.io/instagram/securedtys',
      instagram_url: 'https://www.instagram.com/securedtys/',
      twitter_url: 'https://x.com/securedpicks',
      website_url: 'https://whop.com/securedpicks/'
    },
    aliases: ['securedpicks', 'secured picks', 'tyson nguyen', 'securedtys'],
    guruHandles: ['securedpicks']
  },
  {
    creator: {
      slug: 'kingcap702',
      name: 'KingCap702 (KingCapSports)',
      image_url: 'https://unavatar.io/instagram/kingcap702',
      instagram_url: 'https://www.instagram.com/kingcap702/',
      twitter_url: 'https://x.com/kingcapsports_',
      website_url: 'https://whop.com/kingcapsports/'
    },
    aliases: ['kingcapsports', 'king cap sports', 'kingcap702', 'kingcapsports_'],
    guruHandles: ['kingcap-clips-1']
  },
  {
    creator: {
      slug: 'richard-taylor-hmhw',
      name: 'Richard Taylor (Hold My Hand Wholesale)',
      image_url: 'https://unavatar.io/instagram/richardgrandintaylor',
      instagram_url: 'https://www.instagram.com/richardgrandintaylor/',
      tiktok_url: 'https://www.tiktok.com/@hold_my_hand_wholesale',
      website_url: 'https://whop.com/hold-my-hand-wholesale/'
    },
    aliases: ['hold my hand wholesale', 'holdmyhandwholesale', 'hmhw', 'richard taylor', 'richardgrandintaylor', 'hold_my_hand_wholesale'],
    guruHandles: ['hold-my-hand-wholesale']
  },
  {
    creator: {
      slug: 'profit-lounge',
      name: 'Profit Lounge',
      image_url: 'https://unavatar.io/instagram/profit_lounge',
      instagram_url: 'https://www.instagram.com/profit_lounge/',
      twitter_url: 'https://x.com/profit_lounge',
      website_url: 'https://whop.com/profitlounge/'
    },
    aliases: ['profit lounge', 'profitlounge', 'profit_lounge'],
    guruHandles: ['profitlounge']
  },
  {
    creator: {
      slug: 'pro-sports-advice',
      name: 'Pro Sports Advice',
      image_url: 'https://unavatar.io/instagram/prosportsadviceltd',
      instagram_url: 'https://www.instagram.com/prosportsadviceltd/',
      website_url: 'https://whop.com/pro-sports-advice/'
    },
    aliases: ['pro sports advice', 'prosportsadviceltd', 'psa sports advice'],
    guruHandles: ['elite-vip-membership']
  },
  {
    creator: {
      slug: 'beat-the-books',
      name: 'Beat The Books',
      image_url: 'https://unavatar.io/instagram/beatthebookss',
      instagram_url: 'https://www.instagram.com/beatthebookss/',
      website_url: 'https://whop.com/beat-the-books/'
    },
    aliases: ['beat the books', 'beatthebookss', 'beat-the-books'],
    guruHandles: ['beat-the-books']
  },

  // New/updated identifications (conservative)
  {
    creator: {
      slug: 'apollo-school-of-gods',
      name: 'Apollo (School of Gods)',
      bio: 'Founder/face behind School of Gods (trading education community on Whop).',
      image_url: 'https://unavatar.io/instagram/apollothegreekgod_',
      instagram_url: 'https://www.instagram.com/apollothegreekgod_/',
      website_url: 'https://whop.com/marketplace/schoolofgods/'
    },
    aliases: ['school of gods', 'schoolofgods', 'apollo', 'apollothegreekgod_'],
    guruHandles: ['schoolofgods', 'schoolofgods-paid']
  },
  {
    creator: {
      slug: 'nick-emoney',
      name: 'Nick (eMoney)',
      bio: 'Runs eMoney (reselling deals/price glitches community on Whop).',
      image_url: 'https://unavatar.io/instagram/emoney_resell',
      instagram_url: 'https://www.instagram.com/emoney_resell/',
      website_url: 'https://whop.com/marketplace/emoney/'
    },
    aliases: ['emoney', 'e money', 'nick from emoney', 'nickresell', 'emoney_resell'],
    guruHandles: ['emoney']
  },
  {
    creator: {
      slug: 'hidden-society-trading',
      name: 'Hidden Society Trading',
      bio: 'Trading/community brand on Whop (crypto/forex/stocks).',
      image_url: 'https://unavatar.io/instagram/ahiddensociety',
      instagram_url: 'https://www.instagram.com/ahiddensociety/',
      twitter_url: 'https://x.com/hiddensociety',
      website_url: 'https://whop.com/marketplace/hidden-society/'
    },
    aliases: ['hidden society', 'hidden society trading', 'hiddensociety', 'ahiddensociety'],
    guruHandles: ['hidden-trading']
  },
  {
    creator: {
      slug: 'mysportpick',
      name: 'MySportPick',
      bio: 'Sports betting picks/analysis brand on Whop.',
      image_url: 'https://unavatar.io/instagram/mysportpick',
      instagram_url: 'https://www.instagram.com/mysportpick/',
      website_url: 'https://whop.com/marketplace/mysportpick/'
    },
    aliases: ['mysportpick', 'my sport pick', 'my sportpick'],
    guruHandles: ['mysportpick']
  },
  {
    creator: {
      slug: 'sean-sweeney-deal-soldier',
      name: 'Sean Sweeney (Deal Soldier)',
      bio: 'Co-founder/face behind Deal Soldier (retail arbitrage/clearance deals on Whop).',
      image_url: 'https://unavatar.io/instagram/superunsexy',
      instagram_url: 'https://www.instagram.com/superunsexy/',
      website_url: 'https://whop.com/marketplace/deal-soldier/'
    },
    aliases: ['deal soldier', 'deal_soldier', 'sean sweeney', 'superunsexy'],
    guruHandles: ['free-product-41']
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
