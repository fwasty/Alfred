/*
Fetches og:image from youtube_url and website_url for creators that have a missing/banned image_url.
- Conservative throttling
- No search API usage
*/

const Database = require('better-sqlite3');
const db = new Database('gurusan.db');

function banned(url) {
  if (!url) return true;
  const u = String(url).trim();
  if (!u) return true;
  if (u.includes('unavatar.io/instagram')) return true;
  if (/^https?:\/\/(www\.)?instagram\.com\//i.test(u)) return true;
  return false;
}

async function ogImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    const html = await res.text();
    const m1 = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const m2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const img = (m1 && m1[1]) || (m2 && m2[1]) || null;
    if (!img) return null;
    if (banned(img)) return null;
    return img;
  } catch {
    return null;
  }
}

(async () => {
  const limit = Number(process.env.LIMIT || 80);

  const creators = db
    .prepare(`
      SELECT id, slug, name, image_url, youtube_url, website_url
      FROM creators
      ORDER BY updated_at DESC
    `)
    .all();

  const upd = db.prepare('UPDATE creators SET image_url = ?, updated_at = ? WHERE id = ?');

  let updated = 0;
  for (const c of creators) {
    if (!banned(c.image_url)) continue;

    const candidates = [c.youtube_url, c.website_url].filter(Boolean);
    if (!candidates.length) continue;

    let best = null;
    for (const u of candidates) {
      best = await ogImage(u);
      if (best) break;
      await new Promise((r) => setTimeout(r, 150));
    }

    if (!best) continue;

    upd.run(best, Date.now(), c.id);
    updated++;
    console.log('updated', c.slug, '->', best);

    await new Promise((r) => setTimeout(r, 250));
    if (updated >= limit) break;
  }

  console.log(JSON.stringify({ updated }));
})();
