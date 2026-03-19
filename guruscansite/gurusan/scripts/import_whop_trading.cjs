const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db');
const db = new Database(dbPath);

function cuid() {
  return require('crypto').randomUUID().replace(/-/g, '');
}
function now() {
  return Date.now();
}

function rx1(raw, re) {
  const m = raw.match(re);
  return m && m[1] ? m[1] : null;
}
function unescapeEmbeddedJson(s) {
  return s.replace(/\\\"/g, '"');
}
function extractBracketed(raw, startIdx, open, close) {
  let i = startIdx;
  while (i < raw.length && raw[i] !== open) i++;
  if (i >= raw.length) return null;
  let depth = 0;
  const begin = i;
  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return raw.slice(begin, i + 1);
    }
  }
  return null;
}

async function ingest(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  const html = await res.text();

  const company_id = rx1(html, /company\\\":\\\{[^}]*?id\\\":\\\"(biz_[^\\\"]+)/);
  const route = rx1(html, /company\\\":\\\{[^}]*?route\\\":\\\"([^\\\"]+)/);
  const title = rx1(html, /company\\\":\\\{[^}]*?title\\\":\\\"([^\\\"]+)/);
  const creator_pitch = rx1(html, /creatorPitch\\\":\\\"([^\\\"]+)/);
  const reviews_average = (() => {
    const v = rx1(html, /reviewsAverage\\\":(\d+(?:\\.\d+)?)/);
    return v ? Number(v) : null;
  })();
  const published_reviews_count = (() => {
    const v = rx1(html, /publishedReviewsCount\\\":(\d+)/);
    return v ? Number(v) : null;
  })();
  const logo_url = rx1(html, /logo\\\":\\\{\\\"sourceUrl\\\":\\\"(https:[^\\\"]+)/);
  const review_counts = (() => {
    const v = rx1(html, /reviewCounts\\\":\\\[(\d+(?:,\d+){4})\\\]/);
    return v ? v.split(',').map((n) => Number(n.trim())) : null;
  })();

  const apIdx = html.indexOf('accessPasses');
  let access_passes = [];
  if (apIdx !== -1) {
    const arr = extractBracketed(html, apIdx, '[', ']');
    if (arr) {
      try {
        const json = JSON.parse(unescapeEmbeddedJson(arr));
        access_passes = (json || []).map((p) => {
          const dp = p && p.defaultPlan;
          return {
            product_id: String(p && p.id ? p.id : ''),
            title: p && p.title ? p.title : null,
            headline: p && p.headline ? p.headline : null,
            image_url:
              (p && p.filePicture && p.filePicture.sourceUrl) || (p && p.image && p.image.sourceUrl) || null,
            initial_price_due_cents: dp && typeof dp.initialPriceDueInCents === 'number' ? dp.initialPriceDueInCents : null,
            formatted_period: dp && dp.formattedPeriodV2 ? dp.formattedPeriodV2 : null,
            whop_route: p && p.route ? p.route : null,
          };
        });
      } catch (e) {
        // ignore
      }
    }
  }

  return {
    url,
    company_id,
    route,
    title,
    creator_pitch,
    logo_url,
    reviews_average,
    published_reviews_count,
    review_counts,
    access_passes,
  };
}

function ensureGuru(handle, whopUrl) {
  const g = db.prepare('SELECT * FROM gurus WHERE handle = ?').get(handle);
  if (g) return g;
  const ts = now();
  const id = cuid();
  db.prepare(
    `INSERT INTO gurus (id, name, handle, category, bio, whop_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, handle.replace(/-/g, ' '), handle, 'Trading', null, whopUrl, ts, ts);
  return db.prepare('SELECT * FROM gurus WHERE handle = ?').get(handle);
}

function updateGuru(handle, patch) {
  const ts = now();
  db.prepare(
    `UPDATE gurus
     SET whop_url = ?, whop_route = ?,
         name = COALESCE(?, name),
         bio = COALESCE(?, bio),
         image_url = COALESCE(?, image_url),
         whop_rating = ?,
         whop_reviews_count = ?,
         whop_star_counts = ?,
         whop_synced_at = ?,
         updated_at = ?
     WHERE handle = ?`
  ).run(
    patch.whop_url,
    patch.whop_route,
    patch.title,
    patch.bio,
    patch.image_url,
    patch.whop_rating,
    patch.whop_reviews_count,
    patch.whop_star_counts ? JSON.stringify(patch.whop_star_counts) : null,
    patch.whop_synced_at,
    ts,
    handle
  );
}

function upsertCourse(guruId, input) {
  const ts = now();
  if (input.whop_url) {
    const existing = db.prepare('SELECT * FROM courses WHERE whop_url = ? LIMIT 1').get(input.whop_url);
    if (existing) {
      db.prepare(
        `UPDATE courses
         SET name = COALESCE(?, name),
             image_url = COALESCE(?, image_url),
             price_cents = COALESCE(?, price_cents),
             updated_at = ?
         WHERE id = ?`
      ).run(input.name, input.image_url, input.price_cents, ts, existing.id);
      return;
    }
  }
  const id = cuid();
  db.prepare(
    `INSERT INTO courses (id, guru_id, name, whop_url, image_url, price_cents, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, guruId, input.name, input.whop_url, input.image_url, input.price_cents, ts, ts);
}

const seeds = [
  { handle: 'motion-network', whopUrl: 'https://whop.com/motion-network/' },
  { handle: 'tactical-futures', whopUrl: 'https://whop.com/tactical-futures/' },
  { handle: 'futures-options-signals', whopUrl: 'https://whop.com/futures-options-signals/' },
];

(async () => {
  for (const s of seeds) {
    const g = ensureGuru(s.handle, s.whopUrl);
    const data = await ingest(s.whopUrl);
    updateGuru(s.handle, {
      whop_url: data.url,
      whop_route: data.route,
      title: data.title,
      bio: data.creator_pitch,
      image_url: data.logo_url,
      whop_rating: data.reviews_average,
      whop_reviews_count: data.published_reviews_count,
      whop_star_counts: data.review_counts,
      whop_synced_at: Date.now(),
    });
    for (const ap of data.access_passes) {
      upsertCourse(g.id, {
        whop_url: ap.whop_route ? `https://whop.com/${ap.whop_route}/` : null,
        name: ap.title || ap.headline || ap.product_id,
        image_url: ap.image_url,
        price_cents: ap.initial_price_due_cents,
      });
    }
    console.log('Imported', s.handle, data.title, data.reviews_average, data.published_reviews_count);
  }
})();
