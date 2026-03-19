const Database = require('better-sqlite3');

const db = new Database('gurusan.db');

function norm(s) {
  return String(s || '').toLowerCase();
}

function classify({ courseName, courseSummary, guruName, guruHandle, guruBio, whopUrl, guruWhopUrl }) {
  const t = [courseName, courseSummary, guruName, guruHandle, guruBio, whopUrl, guruWhopUrl]
    .map(norm)
    .join(' ');

  const has = (re) => re.test(t);

  // Offer type
  let offerType = null;
  if (has(/signal|alerts?|picks|vip|live room|trade room|entries|calls|parlay/i)) offerType = 'Signals';
  if (has(/course|academy|masterclass|university|bootcamp|mentorship|training|lesson|ebook/i)) offerType = offerType || 'Education';
  if (has(/community|discord|group|inner circle|members|server/i)) offerType = offerType || 'Community';
  if (has(/bot|indicator|tool|scanner|algo|software|journal|ea\b/i)) offerType = offerType || 'Tools';
  if (has(/1:1|one[- ]on[- ]one|coaching/i)) offerType = offerType || 'Coaching';

  // Category priority rules
  // Futures
  if (has(/\bmnq\b|\bnq\b|\bes\b|\bmes\b|\bym\b|\bmym\b|\bcl\b|\bgc\b|\b6e\b|\bfutures\b|\be-mini\b|prop firm|topstep|apex|eval|combine|funded/i)) {
    return { category: 'Futures', offerType };
  }
  // Options
  if (has(/\b0dte\b|\bspx\b|\bspy\b|\bqqq\b|\boptions\b|calls|puts|iron condor|credit spread|debit spread/i)) {
    return { category: 'Options', offerType };
  }
  // Forex
  if (has(/\bforex\b|\bfx\b|xauusd|eurusd|usdjpy|gbpusd|audusd|nas100|us30|mt4|mt5/i)) {
    return { category: 'Forex', offerType };
  }
  // Crypto
  if (has(/\bcrypto\b|\bbtc\b|bitcoin|\beth\b|ethereum|solana|\bsol\b|memecoin|onchain/i)) {
    return { category: 'Crypto', offerType };
  }
  // Sports betting
  if (has(/sports\s*bet|sportsbook|parlay|\bnfl\b|\bnba\b|\bmlb\b|\bnhl\b|\bufc\b|\bsoccer\b|\bpicks\b/i)) {
    return { category: 'Sports Betting', offerType };
  }
  // Ecom / Reselling
  if (has(/resell|reselling|wholesale|amazon|fba|fbm|seller central|shopify|dropship|dropshipping|ecom|e-commerce|inventory|price error/i)) {
    return { category: 'Ecom / Reselling', offerType };
  }
  // Creator / TikTok Shop
  if (has(/tiktok shop|tt shop|ugc|affiliate|creator|clipping/i)) {
    return { category: 'Creator / TikTok Shop', offerType };
  }
  // AI / Automation
  if (has(/\bai\b|automation|automations|chatbot|agent\b|workflow|zapier|make\.com|n8n|prompt/i)) {
    return { category: 'AI / Automation', offerType };
  }
  // Agency / Marketing
  if (has(/agency|lead gen|leadgen|seo|ads|marketing|client acquisition|cold email|appointments/i)) {
    return { category: 'Agency / Marketing', offerType };
  }
  // Stocks (after others so “stock betting” doesn’t get mis-bucketed)
  if (has(/\bstock\b|\bstocks\b|equities|nyse|nasdaq|shares/i)) {
    return { category: 'Stocks', offerType };
  }
  // Fitness
  if (has(/fitness|workout|nutrition|gym|wellness|health/i)) {
    return { category: 'Fitness / Wellness', offerType };
  }

  return { category: 'Other', offerType };
}

const rows = db
  .prepare(
    `SELECT c.id as course_id, c.name as course_name, c.summary as course_summary, c.whop_url as course_whop_url,
            g.name as guru_name, g.handle as guru_handle, g.bio as guru_bio, g.whop_url as guru_whop_url
     FROM courses c
     JOIN gurus g ON g.id = c.guru_id
     WHERE COALESCE(c.hidden,0)=0 AND COALESCE(g.hidden,0)=0`
  )
  .all();

const upd = db.prepare('UPDATE courses SET category = ?, offer_type = ?, updated_at = ? WHERE id = ?');
const now = Date.now();
let updated = 0;

for (const r of rows) {
  const { category, offerType } = classify({
    courseName: r.course_name,
    courseSummary: r.course_summary,
    guruName: r.guru_name,
    guruHandle: r.guru_handle,
    guruBio: r.guru_bio,
    whopUrl: r.course_whop_url,
    guruWhopUrl: r.guru_whop_url,
  });
  upd.run(category, offerType, now, r.course_id);
  updated++;
}

console.log(JSON.stringify({ considered: rows.length, updated }, null, 2));
