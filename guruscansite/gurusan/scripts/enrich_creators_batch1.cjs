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
  // Key examples
  {
    guruHandle: 'pbtrading',
    creator: {
      slug: 'pb-trading-team',
      name: 'PB Trading (Patrick Lovelace & Blake)',
      bio: 'Trading education brand built by Patrick Lovelace (officialpbtrading) and Blake (pbblakeofficial).',
      instagram_url: 'https://www.instagram.com/officialpbtrading/',
      youtube_url: 'https://www.youtube.com/@PBBlakeYT',
      website_url: 'https://whop.com/pbtrading/',
      image_url: 'https://unavatar.io/instagram/officialpbtrading'
    },
    aliases: ['pb trading', 'officialpbtrading', 'patrick lovelace', 'mrluvlace', 'pb blake', 'pbblakeofficial']
  },
  {
    guruHandle: 'tjr-indicators-bundle',
    creator: {
      slug: 'tjr-trades',
      name: 'TJR Trades',
      bio: 'Trader/educator behind the TJRTRADES indicators and education content.',
      instagram_url: 'https://instagram.com/tjrtrading',
      tiktok_url: 'https://www.tiktok.com/@tjr',
      youtube_url: 'https://www.youtube.com/channel/UCGHBUXjDCeiIXNdKR0HUZnA',
      twitter_url: 'https://x.com/_TJRTrades',
      website_url: 'https://tjrtrades.com/',
      image_url: 'https://unavatar.io/instagram/tjrtrading'
    },
    aliases: ['tjrtrades', 'tjr trades', 'tjr', '_tjrtrades', 'tjrtrading', 'tjr indicators']
  },

  // Existing creator_name gurus -> map to real person/team
  {
    guruHandle: 'motion-network',
    creator: {
      slug: 'riley-botha',
      name: 'Riley Botha',
      bio: 'Trader and educator behind Motion Network.',
      instagram_url: 'https://www.instagram.com/riley_botha/',
      tiktok_url: 'https://www.tiktok.com/@riley_botha',
      youtube_url: 'https://www.youtube.com/@RileyBotha',
      image_url: 'https://unavatar.io/instagram/riley_botha'
    },
    aliases: ['motion network', 'riley botha', 'riley_botha']
  },
  {
    guruHandle: 'brez-marketing',
    creator: {
      slug: 'brezscales',
      name: 'Brezscales',
      bio: 'Creator/marketer behind Brez Marketing.',
      instagram_url: 'https://www.instagram.com/brezscales/',
      image_url: 'https://unavatar.io/instagram/brezscales'
    },
    aliases: ['brez', 'brez marketing', 'brezscales']
  },
  {
    guruHandle: 'potion-alpha',
    creator: {
      slug: 'orangie',
      name: 'Orangie',
      bio: 'Creator behind Potion Alpha.',
      // socials unknown publicly from Whop seed; keep nulls for now
      image_url: null
    },
    aliases: ['potion alpha', 'orangie']
  },
  {
    guruHandle: 'stock-hours',
    creator: {
      slug: 'nourtrades',
      name: 'NourTrades',
      bio: 'Trader behind Stock Hours.',
      instagram_url: 'https://www.instagram.com/nourtrades/',
      image_url: 'https://unavatar.io/instagram/nourtrades'
    },
    aliases: ['stock hours', 'nour', 'nourtrades']
  },
  {
    guruHandle: 'raketrades',
    creator: {
      slug: 'jake-ricci',
      name: 'Jake Ricci',
      bio: 'Trader behind RakeTrades.',
      instagram_url: 'https://www.instagram.com/raketrades/',
      image_url: 'https://unavatar.io/instagram/raketrades'
    },
    aliases: ['raketrades', 'rake trades', 'jake ricci']
  },
  {
    guruHandle: 'miles-high-club',
    creator: {
      slug: 'miles-deutscher',
      name: 'Miles Deutscher',
      bio: 'Crypto creator behind Miles High Club.',
      instagram_url: 'https://www.instagram.com/miles_deutscher/',
      image_url: 'https://unavatar.io/instagram/miles_deutscher'
    },
    aliases: ['miles high club', 'miles deutscher', 'miles_deutscher']
  },
  {
    guruHandle: 'market-fluidity-uni',
    creator: {
      slug: 'raja-banks',
      name: 'Raja Banks',
      bio: 'Educator behind Market Fluidity University.',
      instagram_url: 'https://www.instagram.com/marketfluidity/',
      image_url: 'https://unavatar.io/instagram/marketfluidity'
    },
    aliases: ['market fluidity', 'market fluidity university', 'raja banks', 'marketfluidity']
  },
  {
    guruHandle: 'botostrading',
    creator: {
      slug: 'erik-botos',
      name: 'Erik Botos',
      bio: 'Trader behind Botos Trading Academy.',
      instagram_url: 'https://www.instagram.com/erikbotoss/',
      image_url: 'https://unavatar.io/instagram/erikbotoss'
    },
    aliases: ['botos', 'botos trading', 'botos trading academy', 'erik botos', 'erikbotoss']
  },
  {
    guruHandle: 'team-bull-trading',
    creator: {
      slug: 'jdun',
      name: 'Jdun',
      bio: 'Trader behind Team Bull Trading.',
      instagram_url: 'https://www.instagram.com/jdun_trades/',
      image_url: 'https://unavatar.io/instagram/jdun_trades'
    },
    aliases: ['team bull trading', 'jdun', 'jdun trades', 'jdun_trades']
  },
  {
    guruHandle: 'adt',
    creator: {
      slug: 'coachcwc',
      name: 'CoachCWC',
      bio: 'Trader behind American Dream Trading (ADT).',
      instagram_url: 'https://www.instagram.com/coachcwc/',
      image_url: 'https://unavatar.io/instagram/coachcwc'
    },
    aliases: ['american dream trading', 'adt', 'coachcwc', 'coach cwc']
  },
  {
    guruHandle: 'the-options-cartel',
    creator: {
      slug: 'sean-trades',
      name: 'Sean Trades',
      bio: 'Trader behind The Options Cartel.',
      instagram_url: 'https://www.instagram.com/srxtrades_/',
      image_url: 'https://unavatar.io/instagram/srxtrades_'
    },
    aliases: ['the options cartel', 'options cartel', 'sean trades', 'srxtrades_']
  },
  {
    guruHandle: 'options-insider',
    creator: {
      slug: 'options-insider',
      name: 'Options Insider',
      bio: 'Options education brand.',
      instagram_url: 'https://www.instagram.com/options_insider/',
      image_url: 'https://unavatar.io/instagram/options_insider'
    },
    aliases: ['options insider', 'options_insider']
  },
  {
    guruHandle: 'stockdads',
    creator: {
      slug: 'stock-dads',
      name: 'Stock Dads',
      bio: 'Stock education brand.',
      instagram_url: 'https://www.instagram.com/stockdads/',
      image_url: 'https://unavatar.io/instagram/stockdads'
    },
    aliases: ['stock dads', 'stockdads']
  },
  {
    guruHandle: 'crystal-academy',
    creator: {
      slug: 'crystal-academy',
      name: 'Crystal Academy',
      bio: 'Trading education brand.',
      instagram_url: 'https://www.instagram.com/crystalacademytrades/',
      image_url: 'https://unavatar.io/instagram/crystalacademytrades'
    },
    aliases: ['crystal academy', 'crystalacademytrades']
  },
  {
    guruHandle: 'superluckeee',
    creator: {
      slug: 'superluckeee',
      name: 'Superluckeee',
      bio: 'Trader behind SuperLuckeee Trading.',
      instagram_url: 'https://www.instagram.com/superluckeee/',
      image_url: 'https://unavatar.io/instagram/superluckeee'
    },
    aliases: ['superluckeee', 'super luckeee', 'superluckeee trading']
  },
  {
    guruHandle: 'tradeproelite',
    creator: {
      slug: 'enhancedmarket',
      name: 'EnhancedMarket',
      bio: 'Creator behind TradeProElite.',
      instagram_url: 'https://www.instagram.com/enhancedmarket/',
      image_url: 'https://unavatar.io/instagram/enhancedmarket'
    },
    aliases: ['tradeproelite', 'trade pro elite', 'enhancedmarket']
  },
  {
    guruHandle: 'toodegrees',
    creator: {
      slug: 'toodegrees',
      name: 'Toodegrees',
      bio: 'Trading education brand.',
      instagram_url: 'https://www.instagram.com/toodegrees/',
      image_url: 'https://unavatar.io/instagram/toodegrees'
    },
    aliases: ['toodegrees']
  },
  {
    guruHandle: 'owls-options-traders',
    creator: {
      slug: 'owls-investments',
      name: 'Owls Investments',
      bio: 'Team behind Owls Options Traders.',
      instagram_url: 'https://www.instagram.com/owlsinvestments/',
      image_url: 'https://unavatar.io/instagram/owlsinvestments'
    },
    aliases: ['owls investments', 'owls options traders', 'owlsinvestments']
  },
  {
    guruHandle: 'the-traveling-trader',
    creator: {
      slug: 'the-traveling-trader',
      name: 'The Traveling Trader',
      bio: 'Trader/educator behind The Traveling Trader.',
      instagram_url: 'https://www.instagram.com/thetravel1ngtrader/',
      image_url: 'https://unavatar.io/instagram/thetravel1ngtrader'
    },
    aliases: ['the traveling trader', 'thetravel1ngtrader']
  },
];

const tx = db.transaction(() => {
  for (const e of enrichments) {
    const creator = upsertCreator(e.creator);
    setGuruCreator(e.guruHandle, creator.id);
    for (const a of (e.aliases || [])) addCreatorAlias(creator.id, a);

    // Convenience: auto-alias IG handle if present
    const h = igHandle(creator.instagram_url);
    if (h) addCreatorAlias(creator.id, h);
  }
});

tx();

const changed = enrichments.map(e => {
  const g = db.prepare('SELECT handle, name, creator_id FROM gurus WHERE handle = ?').get(e.guruHandle);
  const c = db.prepare('SELECT id, slug, name, instagram_url, tiktok_url, youtube_url, twitter_url, website_url, image_url FROM creators WHERE id = ?').get(g.creator_id);
  return { guru: g, creator: c };
});

console.log(JSON.stringify({ updated: changed.length, changed }, null, 2));
