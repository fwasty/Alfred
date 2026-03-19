const Database = require('better-sqlite3');

const db = new Database('gurusan.db');

/**
 * Big buckets for launch.
 * Returns { category, offerType }
 */
function classify(text) {
  const t = String(text || '').toLowerCase();

  const has = (re) => re.test(t);

  // Offer type (secondary)
  let offerType = null;
  if (has(/signal|alerts?|picks|vip|live room|trade room|room|entries|calls/i)) offerType = 'Signals';
  if (has(/course|academy|masterclass|university|bootcamp|mentorship|training|lesson/i)) offerType = offerType || 'Education';
  if (has(/community|discord|group|inner circle|members/i)) offerType = offerType || 'Community';
  if (has(/bot|indicator|tool|scanner|algo|software|journal/i)) offerType = offerType || 'Tools';
  if (has(/1:1|one[- ]on[- ]one|coaching/i)) offerType = offerType || 'Coaching';

  // Category (primary)
  if (has(/mnq|nq|es|mes|ym|mym|futures|prop firm|topstep|apex|eval|combine/i)) return { category: 'Futures', offerType };
  if (has(/options?|0dte|spx|spy|calls|puts/i)) return { category: 'Options', offerType };
  if (has(/forex|fx|xauusd|gbp|eurusd|usdjpy/i)) return { category: 'Forex', offerType };
  if (has(/crypto|btc|bitcoin|eth|ethereum|sol|solana|memecoin/i)) return { category: 'Crypto', offerType };
  if (has(/stocks?|equities|nasdaq|nyse|shares/i)) return { category: 'Stocks', offerType };

  if (has(/sports|betting|bets|parlay|book|sportsbook|nba|nfl|mlb|ufc/i)) return { category: 'Sports Betting', offerType };

  if (has(/resell|reselling|wholesale|amazon|fba|shopify|dropship|dropshipping|ecom|e-commerce|tiktok shop|tt shop/i)) {
    // split creator vs ecom/resell
    if (has(/tiktok shop|tt shop|creator|ugc|affiliate/i)) return { category: 'Creator / TikTok Shop', offerType };
    return { category: 'Ecom / Reselling', offerType };
  }

  if (has(/ai|automation|automations|chatbot|agent|workflow|zapier|make\.com|n8n/i)) return { category: 'AI / Automation', offerType };

  if (has(/agency|lead gen|leadgen|seo|ads|marketing|client acquisition|cold email/i)) return { category: 'Agency / Marketing', offerType };

  if (has(/fitness|workout|nutrition|gym|wellness|health/i)) return { category: 'Fitness / Wellness', offerType };

  return { category: 'Other', offerType };
}

const rows = db
  .prepare(
    `SELECT id, name, summary FROM courses WHERE COALESCE(hidden,0)=0`
  )
  .all();

const upd = db.prepare('UPDATE courses SET category = ?, offer_type = ?, updated_at = ? WHERE id = ?');
let updated = 0;
const now = Date.now();

for (const r of rows) {
  const { category, offerType } = classify(`${r.name || ''} ${r.summary || ''}`);
  upd.run(category, offerType, now, r.id);
  updated++;
}

console.log(JSON.stringify({ considered: rows.length, updated }, null, 2));
