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
  const rows = db
    .prepare(
      `SELECT id, slug, name, image_url, youtube_url, website_url
       FROM creators
       ORDER BY updated_at DESC`
    )
    .all();

  let updated = 0;

  for (const c of rows) {
    const img = c.image_url || '';
    const needs = !img || img.includes('unavatar.io/instagram') || img.includes('instagram') || img.includes('api.dicebear.com');
    if (!needs) continue;

    const cand = [c.youtube_url, c.website_url].filter(Boolean);
    if (!cand.length) continue;

    let best = null;
    for (const u of cand) {
      best = await ogImage(u);
      if (best) break;
    }

    if (!best) continue;

    // Avoid silly huge images? keep anyway.
    db.prepare('UPDATE creators SET image_url = COALESCE(NULLIF(image_url,\'\'), ?), updated_at = ? WHERE id = ?')
      .run(best, Date.now(), c.id);
    updated++;
    console.log('updated', c.slug, '->', best);

    // throttle a bit
    await new Promise((r) => setTimeout(r, 250));

    if (updated >= 30) break;
  }

  console.log(JSON.stringify({ updated }));
})();
