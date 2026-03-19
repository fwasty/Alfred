/*
One-time full profile repair pass (DB-only).

Goals:
1) For every *visible* guru (we treat as having a non-empty handle), ensure a creator exists with slug == guru.handle,
   and gurus.creator_id points to it.
2) Ensure creator.name defaults to the Whop handle (not brand title) until claimed.
   (We preserve a custom/claimed name if it's neither blank nor equal to the brand/guru display name.)
3) Remove any unavatar.io/instagram images from creators/courses; replace with guru image (whop logo) or best course image.
4) Ensure every course has an image_url; if missing/bad, inherit from guru.image_url (or best available course image).
5) Print summary counts + remaining issues.
*/

const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database(process.env.SQLITE_PATH || 'gurusan.db');

db.pragma('journal_mode = WAL');

action();

function id() {
  return crypto.randomBytes(16).toString('hex');
}

function norm(s) {
  return (s == null) ? '' : String(s).trim();
}

function looksBadImage(url) {
  const u = norm(url);
  if (!u) return true;

  // Hard bans
  if (u.includes('unavatar.io/instagram')) return true;

  // Banner/preview pages that tend to be “text screenshots” and look awful as avatars
  if (u.includes('whop.com/discover/')) return true;
  if (u.includes('whop.com/marketplace/')) return true;
  if (u.includes('whop.com/reviews/')) return true;
  if (u.includes('whop.com/joined/')) return true;

  // Prefer clean asset URLs (course thumbnails / logos)
  const isWhopAsset =
    (u.includes('.whop.com/uploads/') || u.includes('assets.whop.com/uploads/')) ||
    u.includes('whop.com/core/images/whop/i/biz_');

  // If it's not a known good asset host/pattern, we still allow it (some creators host on their own CDN),
  // but for Whop-origin banners, reject above.
  return false;
}

function pickFirstGood(...urls) {
  for (const u of urls) {
    if (!looksBadImage(u)) return norm(u);
  }
  return null;
}

function action() {
  const now = Date.now();

  const summary = {
    gurusConsidered: 0,
    gurusSkippedNoHandle: 0,

    creatorsCreated: 0,
    gurusLinked: 0,
    gurusRelinked: 0,

    creatorNamesSetToHandle: 0,

    creatorImagesFixed: 0,
    courseImagesFixed: 0,
    courseImagesInheritedFromGuru: 0,

    remaining: {
      creatorsBadImage: 0,
      coursesMissingOrBadImage: 0,
      gurusMissingCreatorLink: 0,
    },

    samples: {
      creatorsBadImage: [],
      coursesMissingOrBadImage: [],
      gurusMissingCreatorLink: [],
    }
  };

  const getVisibleGurus = db.prepare(`
    SELECT *
    FROM gurus
    WHERE COALESCE(hidden,0) = 0
      AND handle IS NOT NULL AND TRIM(handle) != ''
  `);

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

  const updateCreatorNameOnly = db.prepare('UPDATE creators SET name = ?, updated_at = ? WHERE id = ?');
  const updateCreatorImgOnly = db.prepare('UPDATE creators SET image_url = ?, updated_at = ? WHERE id = ?');

  const updateGuruCreatorId = db.prepare('UPDATE gurus SET creator_id = ?, updated_at = ? WHERE id = ?');

  const bestCourseImageForGuru = db.prepare(`
    SELECT image_url
    FROM courses
    WHERE COALESCE(hidden,0) = 0
      AND guru_id = ?
      AND image_url IS NOT NULL
      AND TRIM(image_url) != ''
      AND image_url NOT LIKE '%unavatar.io/instagram%'
    ORDER BY COALESCE(whop_reviews_count,0) DESC, COALESCE(whop_rating,0) DESC, updated_at DESC
    LIMIT 1
  `);

  const getCourses = db.prepare(`
    SELECT c.*, g.image_url AS guru_image_url, g.handle AS guru_handle, g.creator_id AS guru_creator_id
    FROM courses c
    JOIN gurus g ON g.id = c.guru_id
    WHERE COALESCE(c.hidden,0) = 0
      AND COALESCE(g.hidden,0) = 0
  `);
  const updateCourseImage = db.prepare('UPDATE courses SET image_url = ?, updated_at = ? WHERE id = ?');

  const getCreatorById = db.prepare('SELECT * FROM creators WHERE id = ? LIMIT 1');

  const tx = db.transaction(() => {
    // Pass 1: ensure creator per visible guru by handle
    const gurus = getVisibleGurus.all();
    summary.gurusConsidered = gurus.length;

    for (const g of gurus) {
      const handle = norm(g.handle);
      if (!handle) {
        summary.gurusSkippedNoHandle++;
        continue;
      }

      const brandTitle = norm(g.brand_name) || norm(g.name) || '';
      const creatorTitle = norm(g.creator_name) || '';

      const bestCourseImg = (bestCourseImageForGuru.get(g.id) || {}).image_url || null;
      const replacementImg = pickFirstGood(g.image_url, g.creator_image_url, bestCourseImg);

      // creator slug must equal handle
      let c = getCreatorBySlug.get(handle);

      if (!c) {
        const cid = id();
        insertCreator.run(
          cid,
          handle, // default name = handle
          handle,
          g.bio || null,
          replacementImg,
          g.instagram_url || null,
          g.tiktok_url || null,
          g.youtube_url || null,
          g.twitter_url || null,
          g.website_url || null,
          now,
          now
        );
        summary.creatorsCreated++;
        c = getCreatorBySlug.get(handle);
      } else {
        // bring over missing fields conservatively (don’t overwrite non-empty)
        updateCreator.run(
          null,
          g.bio || null,
          replacementImg || '',
          g.instagram_url || '',
          g.tiktok_url || '',
          g.youtube_url || '',
          g.twitter_url || '',
          g.website_url || '',
          now,
          c.id
        );
        c = getCreatorBySlug.get(handle);
      }

      // Ensure guru.creator_id points to this creator
      const currentCid = norm(g.creator_id);
      if (!currentCid) {
        updateGuruCreatorId.run(c.id, now, g.id);
        summary.gurusLinked++;
      } else if (currentCid !== c.id) {
        updateGuruCreatorId.run(c.id, now, g.id);
        summary.gurusRelinked++;
      }

      // Ensure creator.name defaults to handle (unless it looks claimed)
      // Rule: if current creator name is blank OR equals guru display brand/creator titles (common unclaimed defaults), set to handle.
      const cName = norm(c.name);
      const shouldForceHandle =
        !cName ||
        (brandTitle && cName.toLowerCase() === brandTitle.toLowerCase()) ||
        (creatorTitle && cName.toLowerCase() === creatorTitle.toLowerCase()) ||
        (norm(g.name) && cName.toLowerCase() === norm(g.name).toLowerCase());

      if (shouldForceHandle && cName !== handle) {
        updateCreatorNameOnly.run(handle, now, c.id);
        summary.creatorNamesSetToHandle++;
      }

      // Fix creator image if bad
      if (looksBadImage(c.image_url)) {
        const img = pickFirstGood(replacementImg, bestCourseImg);
        if (img) {
          updateCreatorImgOnly.run(img, now, c.id);
          summary.creatorImagesFixed++;
        }
      }
    }

    // Pass 2: fix course images
    const courses = getCourses.all();
    for (const c of courses) {
      const current = c.image_url;
      const missingOrBad = looksBadImage(current);
      if (!missingOrBad) continue;

      // Prefer guru image (whop logo) if good; else best other course image; else creator image.
      const bestOtherCourse = (bestCourseImageForGuru.get(c.guru_id) || {}).image_url || null;
      const creator = c.guru_creator_id ? getCreatorById.get(c.guru_creator_id) : null;
      const chosen = pickFirstGood(c.guru_image_url, bestOtherCourse, creator && creator.image_url);

      if (chosen) {
        updateCourseImage.run(chosen, now, c.id);
        summary.courseImagesFixed++;
        if (!looksBadImage(c.guru_image_url) && (!current || norm(current)==='')) {
          summary.courseImagesInheritedFromGuru++;
        }
      }
    }
  });

  tx();

  // Remaining issues report (post-transaction)
  {
    const badCreators = db.prepare(`
      SELECT id, slug, image_url
      FROM creators
      WHERE COALESCE(hidden,0) = 0
        AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE '%unavatar.io/instagram%')
      LIMIT 25
    `).all();
    summary.remaining.creatorsBadImage = db.prepare(`
      SELECT COUNT(1) AS c
      FROM creators
      WHERE COALESCE(hidden,0) = 0
        AND (image_url IS NULL OR TRIM(image_url) = '' OR image_url LIKE '%unavatar.io/instagram%')
    `).get().c;
    summary.samples.creatorsBadImage = badCreators;

    const badCourses = db.prepare(`
      SELECT c.id, c.name, g.handle as guru_handle, c.image_url
      FROM courses c
      JOIN gurus g ON g.id = c.guru_id
      WHERE COALESCE(c.hidden,0) = 0
        AND COALESCE(g.hidden,0) = 0
        AND (c.image_url IS NULL OR TRIM(c.image_url) = '' OR c.image_url LIKE '%unavatar.io/instagram%')
      LIMIT 25
    `).all();
    summary.remaining.coursesMissingOrBadImage = db.prepare(`
      SELECT COUNT(1) AS c
      FROM courses c
      JOIN gurus g ON g.id = c.guru_id
      WHERE COALESCE(c.hidden,0) = 0
        AND COALESCE(g.hidden,0) = 0
        AND (c.image_url IS NULL OR TRIM(c.image_url) = '' OR c.image_url LIKE '%unavatar.io/instagram%')
    `).get().c;
    summary.samples.coursesMissingOrBadImage = badCourses;

    const missingLinks = db.prepare(`
      SELECT id, handle, creator_id
      FROM gurus
      WHERE COALESCE(hidden,0) = 0
        AND handle IS NOT NULL AND TRIM(handle) != ''
        AND (creator_id IS NULL OR TRIM(creator_id) = '')
      LIMIT 25
    `).all();
    summary.remaining.gurusMissingCreatorLink = db.prepare(`
      SELECT COUNT(1) AS c
      FROM gurus
      WHERE COALESCE(hidden,0) = 0
        AND handle IS NOT NULL AND TRIM(handle) != ''
        AND (creator_id IS NULL OR TRIM(creator_id) = '')
    `).get().c;
    summary.samples.gurusMissingCreatorLink = missingLinks;
  }

  console.log(JSON.stringify(summary, null, 2));
}
