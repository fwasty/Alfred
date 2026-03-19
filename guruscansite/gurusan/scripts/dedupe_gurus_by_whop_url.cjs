const Database = require('better-sqlite3');
const db = new Database('gurusan.db');
const now = Date.now();

const dupes = db.prepare(`
  SELECT whop_url
  FROM gurus
  WHERE COALESCE(hidden,0)=0 AND whop_url IS NOT NULL AND TRIM(whop_url) != ''
  GROUP BY whop_url
  HAVING COUNT(*) > 1
`).all();

const get = db.prepare(`
  SELECT id, handle, name, whop_reviews_count, whop_synced_at, created_at
  FROM gurus
  WHERE COALESCE(hidden,0)=0 AND whop_url = ?
  ORDER BY COALESCE(whop_reviews_count,0) DESC, COALESCE(whop_synced_at,0) DESC, created_at ASC
`);

const hide = db.prepare('UPDATE gurus SET hidden=1, updated_at=? WHERE id=?');

let hidden = 0;
for (const d of dupes) {
  const rows = get.all(d.whop_url);
  if (rows.length < 2) continue;
  const keep = rows[0];
  for (let i=1;i<rows.length;i++) {
    hide.run(now, rows[i].id);
    hidden++;
    console.log('dedupe hide', rows[i].handle, 'keep', keep.handle, 'url', d.whop_url);
  }
}

console.log(JSON.stringify({ hidden, dupeGroups: dupes.length }, null, 2));
