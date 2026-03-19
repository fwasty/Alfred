const Database = require('better-sqlite3');
const db = new Database('gurusan.db');
const crypto = require('crypto');

function cuid(){return crypto.randomUUID().replace(/-/g,'');}
function now(){return Date.now();}

db.exec(`
  CREATE TABLE IF NOT EXISTS guru_aliases (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(guru_id, alias)
  );
  CREATE INDEX IF NOT EXISTS idx_guru_aliases_alias ON guru_aliases(alias);
`);

function addAlias(handle, alias){
  const g = db.prepare('SELECT id FROM gurus WHERE handle = ?').get(handle);
  if(!g){console.log('missing guru', handle);return;}
  db.prepare('INSERT OR IGNORE INTO guru_aliases (id, guru_id, alias, created_at) VALUES (?,?,?,?)')
    .run(cuid(), g.id, alias.toLowerCase(), now());
}

// Riley Botha -> Motion Network (route is motion-network)
addAlias('motion-network','riley botha');
addAlias('motion-network','motion network');

// Orangie -> (placeholder until we find exact whop route for Potion Alpha)
addAlias('clippingculture','orangie');

console.log('done');
