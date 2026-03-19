const Database = require('better-sqlite3');
const db = new Database('gurusan.db');

async function ogImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    const html = await res.text();
    const m1 = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const m2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return (m1 && m1[1]) || (m2 && m2[1]) || null;
  } catch {
    return null;
  }
}

(async () => {
  const bad = db
    .prepare(
      `SELECT id, slug, image_url, youtube_url, website_url
       FROM creators
       WHERE image_url LIKE '%unavatar.io/instagram%'
       ORDER BY updated_at DESC`
    )
    .all();

  let fixed = 0;
  let attempted = 0;

  for (const c of bad) {
    attempted++;

    // 1) Try OG image from youtube_url / website_url.
    const cand = [c.youtube_url, c.website_url].filter(Boolean);
    let best = null;
    for (const u of cand) {
      best = await ogImage(u);
      if (best) break;
    }

    // 2) Fallback: use a linked guru's creator_image_url or image_url.
    if (!best) {
      const g = db
        .prepare(
          `SELECT creator_image_url, image_url
           FROM gurus
           WHERE creator_id = ?
           ORDER BY whop_synced_at DESC, updated_at DESC
           LIMIT 1`
        )
        .get(c.id);
      best = g?.creator_image_url || g?.image_url || null;
    }

    if (!best || best.includes('unavatar.io/instagram')) continue;

    db.prepare('UPDATE creators SET image_url = ?, updated_at = ? WHERE id = ?').run(best, Date.now(), c.id);
    fixed++;
    console.log('fixed', c.slug, '->', best);

    // throttle a bit
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(JSON.stringify({ attempted, fixed }));
})();
