/*
Overnight Guru Scan data hygiene (Option 2 aggressive but verified)

What it does:
1) Batch sync all non-hidden gurus with whop_url via ingestWhopCompanyFromPublicUrl
   - Updates gurus: whop_url, whop_route, title/name/brand_name, bio, image_url, socials, whop ratings + star counts, whop_synced_at
   - Upserts courses for ALL access passes (offers) so /gurus/[handle] shows all offers.
2) Dedupe gurus by:
   - exact normalized whop_url
   - normalized whop route (from whop_route or whop_url)
   For each dupe group: pick canonical (highest whop_reviews_count; then most complete socials; then latest synced)
   - Migrate courses + reviews + guru_aliases to canonical
   - Hide duplicate gurus
3) Social enrichment: NOT fully automated here (requires human/web verification). This script:
   - emits a ranked list of gurus missing socials after Whop sync
   - accepts an optional JSON patch file via --social-patches <path> with verified URLs to apply
4) Creator linking:
   - Ensures each visible guru has a creator_id
   - Links gurus to creators by canonical social identity (normalized social URL set)
   - Merges creators that share the same social identity key; moves guru links + aliases; hides dup creators
   - Adds creator_aliases from guru handle / name / brand_name

Run:
  SQLITE_PATH=/path/to/prod.db node scripts/overnight_guru_profile_hygiene.cjs --apply
  node scripts/overnight_guru_profile_hygiene.cjs --dry-run
  node scripts/overnight_guru_profile_hygiene.cjs --apply --limit-whop 999
  node scripts/overnight_guru_profile_hygiene.cjs --apply --social-patches /tmp/social_patches.json

Social patches JSON shape:
  [{ "guru_handle": "foo", "twitter_url": "...", "instagram_url": "...", "website_url": "..." }]
*/

const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// Allow importing TS helpers (Whop ingest) from src/
require('ts-node/register/transpile-only');
const { ingestWhopCompanyFromPublicUrl } = require('../src/lib/whop');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, dflt = null) => {
  const i = argv.indexOf(f);
  if (i === -1) return dflt;
  return argv[i + 1] ?? dflt;
};

const APPLY = has('--apply');
const DRY_RUN = has('--dry-run') || !APPLY;
const LIMIT_WHOP = Number(val('--limit-whop', '999999'));
const WHOP_START_OFFSET = Number(val('--whop-start-offset', '0'));
const SOCIAL_PATCHES_PATH = val('--social-patches', null);
const WHOP_TIMEOUT_MS = Number(val('--whop-timeout-ms', '25000'));

const db = new Database(process.env.SQLITE_PATH || 'gurusan.db');
db.pragma('journal_mode = WAL');

action().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

function nowMs() {
  return Date.now();
}

function id() {
  return crypto.randomBytes(16).toString('hex');
}

function norm(s) {
  return s == null ? '' : String(s).trim();
}

function normLower(s) {
  return norm(s).toLowerCase();
}

function normUrl(u) {
  const s = norm(u);
  if (!s) return null;
  try {
    const url = new URL(s);
    url.hash = '';
    // drop tracking params
    const drop = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid','igshid'];
    for (const k of drop) url.searchParams.delete(k);
    // normalize hostname
    url.hostname = url.hostname.toLowerCase();
    // normalize protocol
    url.protocol = url.protocol.toLowerCase();
    // normalize trailing slash
    const p = url.pathname.replace(/\/+$/,'');
    url.pathname = p || '/';
    // If no params remain, remove ?
    const out = url.toString();
    return out.replace(/\?$/,'');
  } catch {
    return s;
  }
}

function whopRouteFromUrl(whopUrl) {
  const s = norm(whopUrl);
  if (!s) return null;
  try {
    const u = new URL(s);
    const seg = u.pathname.split('/').filter(Boolean)[0];
    return seg ? seg.toLowerCase() : null;
  } catch {
    return null;
  }
}

function normWhopRoute(routeOrUrl) {
  const r = norm(routeOrUrl);
  if (!r) return null;
  // Accept either a route segment or a full URL.
  if (/^https?:\/\//i.test(r)) return whopRouteFromUrl(r);
  return r.replace(/^\/+|\/+$/g, '').toLowerCase() || null;
}

function socialCount(row) {
  let c = 0;
  for (const k of ['twitter_url','instagram_url','tiktok_url','youtube_url','website_url']) {
    if (norm(row[k])) c++;
  }
  return c;
}

function socialKeyFromRow(row) {
  const parts = [];
  for (const k of ['twitter_url','instagram_url','tiktok_url','youtube_url','website_url']) {
    const n = normUrl(row[k]);
    if (n) parts.push(`${k}:${n.toLowerCase()}`);
  }
  parts.sort();
  return parts.join('|');
}

function pickCanonicalGurus(rows) {
  // Sort descending by reviews, then by social completeness, then by whop_synced_at, then created_at asc
  return rows.slice().sort((a,b) => {
    const ar = Number(a.whop_reviews_count || 0);
    const br = Number(b.whop_reviews_count || 0);
    if (br !== ar) return br - ar;
    const as = socialCount(a);
    const bs = socialCount(b);
    if (bs !== as) return bs - as;
    const at = Number(a.whop_synced_at || 0);
    const bt = Number(b.whop_synced_at || 0);
    if (bt !== at) return bt - at;
    const ac = Number(a.created_at || 0);
    const bc = Number(b.created_at || 0);
    return ac - bc;
  });
}

function withTimeout(promise, ms, msg) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg || `Timeout after ${ms}ms`)), ms)),
  ]);
}

async function action() {
  const startedAt = nowMs();

  const summary = {
    dryRun: DRY_RUN,
    whop: {
      considered: 0,
      synced: 0,
      skippedNoWhopUrl: 0,
      skippedHidden: 0,
      errors: 0,
    },
    offers: {
      upserted: 0,
      fallbackPrimaryOffer: 0,
    },
    dedupe: {
      byWhopUrl: { groups: 0, hidden: 0, migratedCourses: 0, migratedReviews: 0, migratedGuruAliases: 0 },
      byRoute: { groups: 0, hidden: 0, migratedCourses: 0, migratedReviews: 0, migratedGuruAliases: 0 },
    },
    socialPatches: { applied: 0 },
    socials: {
      missingAfterWhopSync: 0,
      sampleMissing: [],
    },
    creators: {
      ensured: 0,
      linkedBySocialIdentity: 0,
      mergedCreators: 0,
      hiddenCreators: 0,
      creatorAliasesAdded: 0,
    },
    runtimeMs: 0,
  };

  // --- Prepared statements ---
  const getGurusForWhop = db.prepare(`
    SELECT *
    FROM gurus
    WHERE COALESCE(hidden,0)=0
      AND whop_url IS NOT NULL AND TRIM(whop_url) != ''
    ORDER BY COALESCE(whop_synced_at,0) ASC, COALESCE(whop_reviews_count,0) DESC, created_at ASC
  `);

  const updateGuruFromIngest = db.prepare(`
    UPDATE gurus
    SET whop_url = ?,
        whop_route = ?,
        brand_name = COALESCE(?, brand_name),
        name = COALESCE(?, name),
        bio = COALESCE(?, bio),
        image_url = COALESCE(?, image_url),
        instagram_url = COALESCE(NULLIF(?,''), instagram_url),
        tiktok_url = COALESCE(NULLIF(?,''), tiktok_url),
        youtube_url = COALESCE(NULLIF(?,''), youtube_url),
        twitter_url = COALESCE(NULLIF(?,''), twitter_url),
        website_url = COALESCE(NULLIF(?,''), website_url),
        creator_image_url = COALESCE(NULLIF(?,''), creator_image_url),
        whop_rating = ?,
        whop_reviews_count = ?,
        whop_star_counts = ?,
        whop_synced_at = ?,
        updated_at = ?
    WHERE id = ?
  `);

  const upsertCourseByWhopUrl = db.prepare('SELECT * FROM courses WHERE whop_url = ? LIMIT 1');
  const updateCourse = db.prepare(`
    UPDATE courses
    SET guru_id=?, name=COALESCE(?,name), image_url=COALESCE(?,image_url), price_cents=COALESCE(?,price_cents),
        whop_rating=COALESCE(?,whop_rating), whop_reviews_count=COALESCE(?,whop_reviews_count), whop_star_counts=COALESCE(?,whop_star_counts),
        summary=COALESCE(?,summary), whop_synced_at=COALESCE(?,whop_synced_at), updated_at=?
    WHERE id=?
  `);

  const insertCourse = db.prepare(`
    INSERT INTO courses (
      id, guru_id, name, whop_url, image_url, price_cents,
      whop_rating, whop_reviews_count, whop_star_counts, summary, whop_synced_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const getVisibleGurus = db.prepare(`
    SELECT * FROM gurus
    WHERE COALESCE(hidden,0)=0 AND handle IS NOT NULL AND TRIM(handle) != ''
  `);

  const hideGuru = db.prepare('UPDATE gurus SET hidden=1, updated_at=? WHERE id=?');
  const moveCourses = db.prepare('UPDATE courses SET guru_id=?, updated_at=? WHERE guru_id=?');
  const moveReviews = db.prepare('UPDATE reviews SET guru_id=?, updated_at=? WHERE guru_id=?');
  const moveGuruAliases = db.prepare('UPDATE guru_aliases SET guru_id=? WHERE guru_id=?');

  const applySocialPatch = db.prepare(`
    UPDATE gurus
    SET twitter_url = COALESCE(NULLIF(?,''), twitter_url),
        instagram_url = COALESCE(NULLIF(?,''), instagram_url),
        tiktok_url = COALESCE(NULLIF(?,''), tiktok_url),
        youtube_url = COALESCE(NULLIF(?,''), youtube_url),
        website_url = COALESCE(NULLIF(?,''), website_url),
        updated_at = ?
    WHERE handle = ? AND COALESCE(hidden,0)=0
  `);

  // Creator ops
  const getCreatorById = db.prepare('SELECT * FROM creators WHERE id=? LIMIT 1');
  const getCreatorBySlug = db.prepare('SELECT * FROM creators WHERE slug=? LIMIT 1');
  const insertCreator = db.prepare(`
    INSERT INTO creators (
      id, name, slug, bio, image_url,
      instagram_url, tiktok_url, youtube_url, twitter_url, website_url,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateGuruCreator = db.prepare('UPDATE gurus SET creator_id=?, updated_at=? WHERE id=?');
  const addCreatorAlias = db.prepare('INSERT OR IGNORE INTO creator_aliases (id, creator_id, alias, created_at) VALUES (?,?,?,?)');
  const hideCreator = db.prepare('UPDATE creators SET hidden=1, updated_at=? WHERE id=?');
  const moveCreatorAliases = db.prepare('UPDATE creator_aliases SET creator_id=? WHERE creator_id=?');
  const updateCreatorSocials = db.prepare(`
    UPDATE creators
    SET instagram_url=COALESCE(NULLIF(?,''),instagram_url),
        tiktok_url=COALESCE(NULLIF(?,''),tiktok_url),
        youtube_url=COALESCE(NULLIF(?,''),youtube_url),
        twitter_url=COALESCE(NULLIF(?,''),twitter_url),
        website_url=COALESCE(NULLIF(?,''),website_url),
        image_url=COALESCE(NULLIF(?,''),image_url),
        bio=COALESCE(?,bio),
        updated_at=?
    WHERE id=?
  `);

  // --- 1) Batch Whop sync ---
  const gurus = getGurusForWhop.all();
  summary.whop.considered = Math.min(gurus.length, LIMIT_WHOP);

  console.log(JSON.stringify({ msg: 'whop_sync_begin', total: gurus.length, startOffset: WHOP_START_OFFSET, limit: LIMIT_WHOP, timeoutMs: WHOP_TIMEOUT_MS, dryRun: DRY_RUN }, null, 2));

  for (let idx = WHOP_START_OFFSET; idx < gurus.length && (idx - WHOP_START_OFFSET) < LIMIT_WHOP; idx++) {
    const g = gurus[idx];
    if (Number(g.hidden || 0) === 1) {
      summary.whop.skippedHidden++;
      continue;
    }
    const whopUrl = norm(g.whop_url);
    if (!whopUrl) {
      summary.whop.skippedNoWhopUrl++;
      continue;
    }

    try {
      const ingest = await withTimeout(
        ingestWhopCompanyFromPublicUrl(whopUrl),
        WHOP_TIMEOUT_MS,
        `Whop ingest timeout after ${WHOP_TIMEOUT_MS}ms`
      );
      const ts = nowMs();
      const creator_image_url = ingest.logo_url;
      const starCounts = ingest.review_counts ? JSON.stringify(ingest.review_counts) : null;

      if (!DRY_RUN) {
        updateGuruFromIngest.run(
          ingest.whop_url,
          ingest.route,
          ingest.title,
          ingest.title,
          ingest.creator_pitch,
          ingest.logo_url,
          ingest.socials.instagram_url || '',
          ingest.socials.tiktok_url || '',
          ingest.socials.youtube_url || '',
          ingest.socials.twitter_url || '',
          ingest.socials.website_url || '',
          creator_image_url || '',
          ingest.reviews_average,
          ingest.published_reviews_count,
          starCounts,
          ts,
          ts,
          g.id
        );

        // Offers -> courses
        if (!ingest.access_passes || ingest.access_passes.length === 0) {
          // Fallback primary offer
          const courseWhopUrl = ingest.whop_url || whopUrl;
          upsertCourseForGuru(g.id, {
            whop_url: courseWhopUrl,
            name: ingest.title || g.brand_name || g.name || g.handle || 'Offer',
            image_url: ingest.logo_url || g.image_url || null,
            price_cents: null,
            whop_rating: ingest.reviews_average,
            whop_reviews_count: ingest.published_reviews_count,
            whop_star_counts: ingest.review_counts,
            summary: ingest.creator_pitch,
            whop_synced_at: ts,
          });
          summary.offers.fallbackPrimaryOffer++;
        } else {
          for (const ap of ingest.access_passes) {
            const apUrl = ap.product_id
              ? `https://whop.com/${ap.whop_route || ingest.route || ''}/`
              : null;
            upsertCourseForGuru(g.id, {
              whop_url: apUrl,
              name: ap.title || ap.headline || ap.product_id,
              image_url: ap.image_url,
              price_cents: ap.initial_price_due_cents,
              whop_rating: ap.reviews_average,
              whop_reviews_count: ap.published_reviews_count,
              whop_star_counts: ap.review_counts,
              summary: ap.summary,
              whop_synced_at: ts,
            });
          }
        }
      }

      summary.whop.synced++;
    } catch (e) {
      summary.whop.errors++;
      console.warn('whop sync error', { idx, handle: g.handle, whop_url: g.whop_url, err: String((e && e.message) || e) });
    }

    const processed = (idx - WHOP_START_OFFSET) + 1;
    if (processed % 10 === 0) {
      console.log(JSON.stringify({ msg: 'whop_sync_progress', processed, synced: summary.whop.synced, errors: summary.whop.errors, last: { handle: g.handle, whop_url: g.whop_url } }));
    }
  }

  function upsertCourseForGuru(guruId, input) {
    const ts = nowMs();
    const whop_url = input.whop_url ? normUrl(input.whop_url) : null;

    if (whop_url) {
      const existing = upsertCourseByWhopUrl.get(whop_url);
      if (existing) {
        updateCourse.run(
          guruId,
          input.name,
          input.image_url,
          input.price_cents,
          input.whop_rating ?? null,
          input.whop_reviews_count ?? null,
          input.whop_star_counts ? JSON.stringify(input.whop_star_counts) : null,
          input.summary ?? null,
          input.whop_synced_at ?? null,
          ts,
          existing.id
        );
        summary.offers.upserted++;
        return;
      }
    }

    const cid = id();
    insertCourse.run(
      cid,
      guruId,
      input.name,
      whop_url,
      input.image_url ?? null,
      input.price_cents ?? null,
      input.whop_rating ?? null,
      input.whop_reviews_count ?? null,
      input.whop_star_counts ? JSON.stringify(input.whop_star_counts) : null,
      input.summary ?? null,
      input.whop_synced_at ?? null,
      ts,
      ts
    );
    summary.offers.upserted++;
  }

  // --- Optional: apply verified social patches ---
  if (SOCIAL_PATCHES_PATH) {
    let patches = [];
    try {
      patches = JSON.parse(fs.readFileSync(SOCIAL_PATCHES_PATH, 'utf8'));
    } catch (e) {
      throw new Error(`Failed to read --social-patches ${SOCIAL_PATCHES_PATH}: ${String(e && e.message || e)}`);
    }

    const ts = nowMs();
    for (const p of patches) {
      if (!p || !norm(p.guru_handle)) continue;
      if (!DRY_RUN) {
        applySocialPatch.run(
          p.twitter_url || '',
          p.instagram_url || '',
          p.tiktok_url || '',
          p.youtube_url || '',
          p.website_url || '',
          ts,
          norm(p.guru_handle)
        );
      }
      summary.socialPatches.applied++;
    }
  }

  // --- 2) Dedupe gurus (by whop_url, then by route) ---
  const dedupeTx = db.transaction(() => {
    const ts = nowMs();

    // 2a: by normalized whop_url
    {
      const rows = db.prepare(`
        SELECT *
        FROM gurus
        WHERE COALESCE(hidden,0)=0 AND whop_url IS NOT NULL AND TRIM(whop_url) != ''
      `).all();

      const map = new Map();
      for (const r of rows) {
        const k = normUrl(r.whop_url);
        if (!k) continue;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
      }

      for (const [k, group] of map.entries()) {
        if (group.length < 2) continue;
        summary.dedupe.byWhopUrl.groups++;
        const sorted = pickCanonicalGurus(group);
        const keep = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
          const dupe = sorted[i];
          if (dupe.id === keep.id) continue;

          if (!DRY_RUN) {
            const beforeCourses = db.prepare('SELECT COUNT(1) as c FROM courses WHERE guru_id=?').get(dupe.id).c;
            const beforeReviews = db.prepare('SELECT COUNT(1) as c FROM reviews WHERE guru_id=?').get(dupe.id).c;
            const beforeAliases = db.prepare('SELECT COUNT(1) as c FROM guru_aliases WHERE guru_id=?').get(dupe.id).c;

            moveCourses.run(keep.id, ts, dupe.id);
            moveReviews.run(keep.id, ts, dupe.id);
            moveGuruAliases.run(keep.id, dupe.id);
            hideGuru.run(ts, dupe.id);

            summary.dedupe.byWhopUrl.migratedCourses += Number(beforeCourses || 0);
            summary.dedupe.byWhopUrl.migratedReviews += Number(beforeReviews || 0);
            summary.dedupe.byWhopUrl.migratedGuruAliases += Number(beforeAliases || 0);
          }

          summary.dedupe.byWhopUrl.hidden++;
        }
      }
    }

    // 2b: by normalized whop route
    {
      const rows = db.prepare(`
        SELECT *
        FROM gurus
        WHERE COALESCE(hidden,0)=0
          AND (
            (whop_route IS NOT NULL AND TRIM(whop_route) != '')
            OR (whop_url IS NOT NULL AND TRIM(whop_url) != '')
          )
      `).all();

      const map = new Map();
      for (const r of rows) {
        const k = normWhopRoute(r.whop_route) || whopRouteFromUrl(r.whop_url);
        if (!k) continue;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
      }

      for (const [k, group] of map.entries()) {
        if (group.length < 2) continue;
        // Skip groups where whop_url differs AND route could plausibly collide (rare, but be careful):
        // if >=2 distinct normalized whop_url exist, still dedupe, but we log only.
        summary.dedupe.byRoute.groups++;
        const sorted = pickCanonicalGurus(group);
        const keep = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
          const dupe = sorted[i];
          if (dupe.id === keep.id) continue;

          if (!DRY_RUN) {
            const beforeCourses = db.prepare('SELECT COUNT(1) as c FROM courses WHERE guru_id=?').get(dupe.id).c;
            const beforeReviews = db.prepare('SELECT COUNT(1) as c FROM reviews WHERE guru_id=?').get(dupe.id).c;
            const beforeAliases = db.prepare('SELECT COUNT(1) as c FROM guru_aliases WHERE guru_id=?').get(dupe.id).c;

            moveCourses.run(keep.id, ts, dupe.id);
            moveReviews.run(keep.id, ts, dupe.id);
            moveGuruAliases.run(keep.id, dupe.id);
            hideGuru.run(ts, dupe.id);

            summary.dedupe.byRoute.migratedCourses += Number(beforeCourses || 0);
            summary.dedupe.byRoute.migratedReviews += Number(beforeReviews || 0);
            summary.dedupe.byRoute.migratedGuruAliases += Number(beforeAliases || 0);
          }

          summary.dedupe.byRoute.hidden++;
        }
      }
    }
  });

  dedupeTx();

  // --- 3) Identify socials missing (post-whop + optional patches) ---
  {
    const missing = db.prepare(`
      SELECT id, handle, name, brand_name, whop_url, whop_route,
             twitter_url, instagram_url, tiktok_url, youtube_url, website_url,
             COALESCE(whop_reviews_count,0) as whop_reviews_count
      FROM gurus
      WHERE COALESCE(hidden,0)=0
        AND (whop_url IS NOT NULL AND TRIM(whop_url) != '')
        AND (
          (twitter_url IS NULL OR TRIM(twitter_url) = '')
          AND (instagram_url IS NULL OR TRIM(instagram_url) = '')
          AND (tiktok_url IS NULL OR TRIM(tiktok_url) = '')
          AND (youtube_url IS NULL OR TRIM(youtube_url) = '')
          AND (website_url IS NULL OR TRIM(website_url) = '')
        )
      ORDER BY COALESCE(whop_reviews_count,0) DESC
      LIMIT 50
    `).all();

    const total = db.prepare(`
      SELECT COUNT(1) as c
      FROM gurus
      WHERE COALESCE(hidden,0)=0
        AND (whop_url IS NOT NULL AND TRIM(whop_url) != '')
        AND (
          (twitter_url IS NULL OR TRIM(twitter_url) = '')
          AND (instagram_url IS NULL OR TRIM(instagram_url) = '')
          AND (tiktok_url IS NULL OR TRIM(tiktok_url) = '')
          AND (youtube_url IS NULL OR TRIM(youtube_url) = '')
          AND (website_url IS NULL OR TRIM(website_url) = '')
        )
    `).get().c;

    summary.socials.missingAfterWhopSync = Number(total || 0);
    summary.socials.sampleMissing = missing;
  }

  // --- 4) Creator linking + merging by social identity ---
  const creatorTx = db.transaction(() => {
    const ts = nowMs();

    const gurus2 = getVisibleGurus.all();

    // 4a) Ensure each guru has a creator (by handle slug) + update creator socials
    for (const g of gurus2) {
      const handle = norm(g.handle);
      if (!handle) continue;

      let c = g.creator_id ? getCreatorById.get(g.creator_id) : null;
      if (!c) {
        c = getCreatorBySlug.get(handle);
      }
      if (!c) {
        if (!DRY_RUN) {
          const cid = id();
          insertCreator.run(
            cid,
            handle,
            handle,
            g.bio || null,
            g.creator_image_url || g.image_url || null,
            g.instagram_url || null,
            g.tiktok_url || null,
            g.youtube_url || null,
            g.twitter_url || null,
            g.website_url || null,
            ts,
            ts
          );
          c = getCreatorById.get(cid);
        }
      }

      if (c) {
        summary.creators.ensured++;

        if (!DRY_RUN) {
          // Link guru to creator
          if (!g.creator_id || g.creator_id !== c.id) {
            updateGuruCreator.run(c.id, ts, g.id);
          }

          // Bring over socials to creator (do not overwrite non-empty with empty)
          updateCreatorSocials.run(
            g.instagram_url || '',
            g.tiktok_url || '',
            g.youtube_url || '',
            g.twitter_url || '',
            g.website_url || '',
            g.creator_image_url || g.image_url || '',
            g.bio || null,
            ts,
            c.id
          );

          // Add aliases
          for (const a of [handle, g.name, g.brand_name, g.creator_name, g.whop_route].map(normLower).filter(Boolean)) {
            addCreatorAlias.run(id(), c.id, a, ts);
            summary.creators.creatorAliasesAdded++;
          }
        }
      }
    }

    // 4b) Link gurus to creators by social identity (socialKey) and merge dup creators
    const creators = db.prepare(`
      SELECT * FROM creators WHERE COALESCE(hidden,0)=0
    `).all();

    const keyToCreators = new Map();
    for (const c of creators) {
      const k = socialKeyFromRow(c);
      if (!k) continue;
      if (!keyToCreators.has(k)) keyToCreators.set(k, []);
      keyToCreators.get(k).push(c);
    }

    const countGurusForCreator = db.prepare('SELECT COUNT(1) as c FROM gurus WHERE COALESCE(hidden,0)=0 AND creator_id=?').pluck();

    const pickCanonicalCreator = (rows) => {
      return rows.slice().sort((a,b) => {
        const ag = Number(countGurusForCreator.get(a.id) || 0);
        const bg = Number(countGurusForCreator.get(b.id) || 0);
        if (bg !== ag) return bg - ag;
        const as = socialCount(a);
        const bs = socialCount(b);
        if (bs !== as) return bs - as;
        const au = Number(a.updated_at || 0);
        const bu = Number(b.updated_at || 0);
        if (bu !== au) return bu - au;
        const ac = Number(a.created_at || 0);
        const bc = Number(b.created_at || 0);
        return ac - bc;
      });
    };

    const updateGurusCreatorId = db.prepare('UPDATE gurus SET creator_id=?, updated_at=? WHERE creator_id=?');

    for (const [k, group] of keyToCreators.entries()) {
      if (group.length < 2) continue;

      const sorted = pickCanonicalCreator(group);
      const keep = sorted[0];

      for (let i=1;i<sorted.length;i++) {
        const dupe = sorted[i];
        if (dupe.id === keep.id) continue;

        if (!DRY_RUN) {
          updateGurusCreatorId.run(keep.id, ts, dupe.id);
          moveCreatorAliases.run(keep.id, dupe.id);
          hideCreator.run(ts, dupe.id);
        }

        summary.creators.mergedCreators++;
        summary.creators.hiddenCreators++;
      }
    }

    // 4c) Link gurus to creator by matching social key to existing creator
    const gurus3 = getVisibleGurus.all();
    for (const g of gurus3) {
      const gk = socialKeyFromRow(g);
      if (!gk) continue;
      const group = keyToCreators.get(gk);
      if (!group || group.length === 0) continue;
      const keep = pickCanonicalCreator(group)[0];

      if (!g.creator_id || g.creator_id !== keep.id) {
        if (!DRY_RUN) updateGuruCreator.run(keep.id, ts, g.id);
        summary.creators.linkedBySocialIdentity++;
      }
    }
  });

  creatorTx();

  summary.runtimeMs = nowMs() - startedAt;

  console.log(JSON.stringify(summary, null, 2));

  if (DRY_RUN) {
    console.log('\nNOTE: Dry run mode (no DB writes). Re-run with --apply to persist changes.');
  }
}
