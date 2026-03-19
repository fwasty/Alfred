const Database = require('better-sqlite3');

const db = new Database('gurusan.db');
const rows = db
  .prepare(
    "SELECT handle, whop_url FROM gurus WHERE COALESCE(hidden,0)=0 AND image_url LIKE 'https://whop.com/core/images/whop/i/biz_%' AND handle IS NOT NULL AND TRIM(handle) != '' ORDER BY COALESCE(whop_reviews_count,0) DESC LIMIT 200"
  )
  .all();

async function postSync(handle, whopUrl) {
  const res = await fetch('http://localhost:3112/api/whop/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ handle, whopUrl }),
  });
  if (!res.ok) throw new Error(`${handle}: ${res.status}`);
  return res.json();
}

(async () => {
  let ok = 0;
  let fail = 0;
  for (const r of rows) {
    try {
      const j = await postSync(r.handle, r.whop_url);
      const logo = j?.ingest?.logo_url || null;
      if (logo && String(logo).includes('img-v2-prod.whop.com/')) {
        ok++;
        console.log('updated', r.handle);
      } else {
        ok++;
        console.log('synced', r.handle);
      }
    } catch (e) {
      fail++;
      console.log('fail', r.handle, String(e?.message || e));
    }
  }
  console.log(JSON.stringify({ considered: rows.length, ok, fail }, null, 2));
})();
