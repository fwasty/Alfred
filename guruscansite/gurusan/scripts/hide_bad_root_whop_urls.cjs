const Database = require('better-sqlite3');
const db = new Database('gurusan.db');
const now = Date.now();

const rows = db.prepare("SELECT id,handle,name FROM gurus WHERE COALESCE(hidden,0)=0 AND whop_url='https://whop.com/'").all();
const upd = db.prepare('UPDATE gurus SET hidden=1, updated_at=? WHERE id=?');
let hidden=0;
for (const r of rows) {
  upd.run(now, r.id);
  hidden++;
  console.log('hidden', r.handle, r.name);
}
console.log(JSON.stringify({ hidden }, null, 2));
