const Database = require('better-sqlite3');
const db = new Database('gurusan.db');

const now = Date.now();
const rows = db.prepare(`
  SELECT c.id as course_id, g.image_url as guru_img, g.creator_image_url as creator_img
  FROM courses c
  JOIN gurus g ON g.id = c.guru_id
  WHERE (c.image_url IS NULL OR TRIM(c.image_url)='')
    AND COALESCE(g.creator_image_url, g.image_url) IS NOT NULL
    AND TRIM(COALESCE(g.creator_image_url, g.image_url)) != ''
`).all();

const upd = db.prepare('UPDATE courses SET image_url = ?, updated_at = ? WHERE id = ?');
let updated = 0;
for (const r of rows) {
  const img = r.creator_img || r.guru_img;
  upd.run(img, now, r.course_id);
  updated++;
}
console.log(JSON.stringify({ updated }, null, 2));
