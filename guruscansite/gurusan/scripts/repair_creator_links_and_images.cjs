/*
Repairs:
- gurus.creator_id missing -> create/update a creators row and link it.
- creators.image_url blank or unavatar instagram -> try to replace with guru.creator_image_url / guru.image_url.
- courses with whop_url matching a guru.whop_url but wrong guru_id -> reattach.

Conservative: does NOT web-fetch. Only uses existing DB fields.
*/

const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database('gurusan.db');

function id() {
  return crypto.randomBytes(16).toString('hex');
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'creator';
}

function looksBadImage(url) {
  if (!url) return true;
  const u = String(url);
  if (!u.trim()) return true;
  if (u.includes('unavatar.io/instagram')) return true;
  return false;
}

const now = Date.now();
let linked = 0;
let fixedCreatorImages = 0;
let reattachedCourses = 0;

// 1) Reattach courses by matching whop_url to guru.whop_url
{
  const rows = db.prepare(`
    SELECT c.id as course_id, c.guru_id as course_guru_id, c.whop_url, g.id as correct_guru_id
    FROM courses c
    JOIN gurus g ON g.whop_url = c.whop_url
    WHERE c.whop_url IS NOT NULL AND c.whop_url != '' AND c.guru_id != g.id
  `).all();

  const stmt = db.prepare('UPDATE courses SET guru_id = ?, updated_at = ? WHERE id = ?');
  for (const r of rows) {
    stmt.run(r.correct_guru_id, now, r.course_id);
    reattachedCourses++;
  }
}

// 2) Link gurus missing creator_id
{
  const gurus = db.prepare(`
    SELECT *
    FROM gurus
    WHERE creator_id IS NULL OR TRIM(creator_id) = ''
  `).all();

  const getCreatorBySlug = db.prepare('SELECT * FROM creators WHERE slug = ? LIMIT 1');
  const insertCreator = db.prepare(`
    INSERT INTO creators (
      id, name, slug, bio, image_url,
      instagram_url, tiktok_url, youtube_url, twitter_url, website_url,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateCreator = db.prepare(`
    UPDATE creators
    SET name = COALESCE(?, name),
        bio = COALESCE(?, bio),
        image_url = COALESCE(NULLIF(?, ''), image_url),
        instagram_url = COALESCE(NULLIF(?, ''), instagram_url),
        tiktok_url = COALESCE(NULLIF(?, ''), tiktok_url),
        youtube_url = COALESCE(NULLIF(?, ''), youtube_url),
        twitter_url = COALESCE(NULLIF(?, ''), twitter_url),
        website_url = COALESCE(NULLIF(?, ''), website_url),
        updated_at = ?
    WHERE id = ?
  `);

  const updateGuru = db.prepare(`
    UPDATE gurus
    SET creator_id = ?,
        creator_name = COALESCE(NULLIF(creator_name,''), ?),
        brand_name = COALESCE(NULLIF(brand_name,''), ?),
        creator_image_url = COALESCE(NULLIF(creator_image_url,''), ?),
        updated_at = ?
    WHERE id = ?
  `);

  for (const g of gurus) {
    const creatorName = (g.creator_name && g.creator_name.trim()) ? g.creator_name.trim() : (g.name || '').trim();
    const brandName = (g.brand_name && g.brand_name.trim()) ? g.brand_name.trim() : (g.name || '').trim();

    // pick best image already known
    const bestImage = (!looksBadImage(g.creator_image_url) ? g.creator_image_url : null) ||
      (!looksBadImage(g.image_url) ? g.image_url : null) ||
      (g.creator_image_url || g.image_url || null);

    const seed = slugify(creatorName || brandName || g.handle);
    let slug = seed;

    // avoid slug collision with different person/brand by appending handle
    let c = getCreatorBySlug.get(slug);
    if (c && c.name && c.name.toLowerCase() !== creatorName.toLowerCase()) {
      slug = slugify(`${seed}-${g.handle || g.id.slice(0,6)}`);
      c = getCreatorBySlug.get(slug);
    }

    if (!c) {
      const cid = id();
      insertCreator.run(
        cid,
        creatorName || brandName || g.handle || 'Creator',
        slug,
        g.bio || null,
        bestImage,
        g.instagram_url || null,
        g.tiktok_url || null,
        g.youtube_url || null,
        g.twitter_url || null,
        g.website_url || null,
        now,
        now
      );
      c = { id: cid, slug };
    } else {
      updateCreator.run(
        creatorName || null,
        g.bio || null,
        bestImage || '',
        g.instagram_url || '',
        g.tiktok_url || '',
        g.youtube_url || '',
        g.twitter_url || '',
        g.website_url || '',
        now,
        c.id
      );
    }

    updateGuru.run(
      c.id,
      creatorName || null,
      brandName || null,
      bestImage || null,
      now,
      g.id
    );

    linked++;
  }
}

// 3) Fix creator images using linked gurus when creator image is bad/blank
{
  const creators = db.prepare('SELECT id, slug, image_url FROM creators').all();
  const bestFromGuru = db.prepare(`
    SELECT creator_image_url, image_url
    FROM gurus
    WHERE creator_id = ?
    ORDER BY COALESCE(whop_reviews_count,0) DESC
    LIMIT 10
  `);

  const updateCreatorImg = db.prepare('UPDATE creators SET image_url = ?, updated_at = ? WHERE id = ?');

  for (const c of creators) {
    if (!looksBadImage(c.image_url)) continue;
    const gs = bestFromGuru.all(c.id);
    let best = null;
    for (const g of gs) {
      if (!looksBadImage(g.creator_image_url)) { best = g.creator_image_url; break; }
      if (!looksBadImage(g.image_url)) { best = g.image_url; break; }
    }
    if (!best) continue;
    updateCreatorImg.run(best, now, c.id);
    fixedCreatorImages++;
  }
}

console.log(JSON.stringify({ reattachedCourses, linked, fixedCreatorImages }, null, 2));
