import Database from 'better-sqlite3'
import path from 'path'

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'gurusan.db')

const globalForDb = globalThis as unknown as { _db?: Database.Database }

export const db: Database.Database = globalForDb._db ?? new Database(dbPath)

if (process.env.NODE_ENV !== 'production') globalForDb._db = db

export function migrate() {
  db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gurus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT UNIQUE,
    category TEXT NOT NULL DEFAULT 'Trading',
    bio TEXT,
    whop_url TEXT,
    image_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    tiktok_url TEXT,
    instagram_url TEXT,
    website_url TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    whop_rating REAL,
    whop_reviews_count INTEGER,
    whop_star_counts TEXT,
    whop_route TEXT,
    whop_synced_at INTEGER,
    guru_rating REAL,
    guru_reviews_count INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    name TEXT NOT NULL,
    whop_url TEXT UNIQUE,
    image_url TEXT,
    price_cents INTEGER,
    whop_rating REAL,
    whop_reviews_count INTEGER,
    whop_star_counts TEXT,
    summary TEXT,
    whop_synced_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (guru_id) REFERENCES gurus(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    course_id TEXT,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    title TEXT,
    body TEXT NOT NULL,
    anonymous INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, guru_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (guru_id) REFERENCES gurus(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS creators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    youtube_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(slug)
  );

  CREATE TABLE IF NOT EXISTS creator_aliases (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(creator_id, alias),
    FOREIGN KEY (creator_id) REFERENCES creators(id)
  );

  CREATE TABLE IF NOT EXISTS guru_aliases (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(guru_id, alias),
    FOREIGN KEY (guru_id) REFERENCES gurus(id)
  );

  CREATE TABLE IF NOT EXISTS course_aliases (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(course_id, alias),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_guru ON reviews(guru_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
  `)

  // lightweight “migrations” for existing DBs (safe to run repeatedly)
  const addCol = (table: string, col: string, type: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`)
    } catch {
      // ignore (already exists)
    }
  }
  addCol('gurus', 'image_url', 'TEXT')
  addCol('gurus', 'twitter_url', 'TEXT')
  addCol('gurus', 'youtube_url', 'TEXT')
  addCol('gurus', 'tiktok_url', 'TEXT')
  addCol('gurus', 'instagram_url', 'TEXT')
  addCol('gurus', 'website_url', 'TEXT')
  addCol('gurus', 'creator_name', 'TEXT')
  addCol('gurus', 'brand_name', 'TEXT')
  addCol('gurus', 'creator_image_url', 'TEXT')
  addCol('gurus', 'creator_id', 'TEXT')
  addCol('gurus', 'verified', 'INTEGER NOT NULL DEFAULT 0')
  addCol('gurus', 'whop_rating', 'REAL')
  addCol('gurus', 'whop_reviews_count', 'INTEGER')
  addCol('gurus', 'whop_star_counts', 'TEXT')
  addCol('gurus', 'whop_route', 'TEXT')
  addCol('gurus', 'whop_synced_at', 'INTEGER')

  addCol('gurus', 'guru_rating', 'REAL')
  addCol('gurus', 'guru_reviews_count', 'INTEGER')

  addCol('courses', 'image_url', 'TEXT')
  addCol('courses', 'whop_rating', 'REAL')
  addCol('courses', 'whop_reviews_count', 'INTEGER')
  addCol('courses', 'whop_star_counts', 'TEXT')
  addCol('courses', 'summary', 'TEXT')
  addCol('courses', 'whop_synced_at', 'INTEGER')

  addCol('reviews', 'anonymous', 'INTEGER NOT NULL DEFAULT 0')

  // aliases table for better search (creator name != product name)
  db.exec(`
    CREATE TABLE IF NOT EXISTS guru_aliases (
      id TEXT PRIMARY KEY,
      guru_id TEXT NOT NULL,
      alias TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(guru_id, alias)
    );
    CREATE INDEX IF NOT EXISTS idx_guru_aliases_alias ON guru_aliases(alias);
    CREATE INDEX IF NOT EXISTS idx_creator_aliases_alias ON creator_aliases(alias);
    CREATE INDEX IF NOT EXISTS idx_course_aliases_alias ON course_aliases(alias);
  `)
}

export function seed() {
  // Seed can run concurrently during `next build` page-data collection.
  // Use an immediate transaction + INSERT OR IGNORE to make it safe/idempotent.
  db.exec('BEGIN IMMEDIATE')
  try {
    const row = db.prepare('SELECT COUNT(1) as c FROM gurus').get() as { c: number }
    if (row.c > 0) {
      db.exec('COMMIT')
      return
    }

    const ts = Date.now()
    const insertGuru = db.prepare(
      `INSERT OR IGNORE INTO gurus (
        id, name, handle, category, bio, whop_url,
        image_url, twitter_url, youtube_url, tiktok_url, instagram_url, website_url,
        verified, whop_rating, whop_reviews_count, guru_rating, guru_reviews_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const insertCourse = db.prepare(
      `INSERT OR IGNORE INTO courses (id, guru_id, name, whop_url, image_url, price_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )

  const gurus = [
    {
      id: 'g_example',
      name: 'Example Trading Guru',
      handle: 'exampleguru',
      category: 'Trading',
      bio: 'Mock profile. Replace with real Whop top performers.',
      whop_url: 'https://whop.com/',
      image_url: 'https://api.dicebear.com/9.x/identicon/svg?seed=exampleguru',
      twitter_url: 'https://x.com/',
      youtube_url: 'https://youtube.com/',
      tiktok_url: 'https://tiktok.com/',
      instagram_url: 'https://instagram.com/',
      website_url: 'https://example.com/',
      verified: 0,
      whop_rating: 4.6,
      whop_reviews_count: 128,
      guru_rating: null,
      guru_reviews_count: 0,
      courses: [{ id: 'c_example', name: 'NQ Levels Pack', whop_url: 'https://whop.com/', image_url: 'https://picsum.photos/seed/nq/640/360', price_cents: 4999 }],
    },
    {
      id: 'g_futureslab',
      name: 'Futures Systems Lab',
      handle: 'futureslab',
      category: 'Trading',
      bio: 'Mock profile.',
      whop_url: 'https://whop.com/',
      image_url: 'https://api.dicebear.com/9.x/identicon/svg?seed=futureslab',
      twitter_url: 'https://x.com/',
      youtube_url: 'https://youtube.com/',
      tiktok_url: 'https://tiktok.com/',
      instagram_url: null,
      website_url: null,
      verified: 1,
      whop_rating: 4.2,
      whop_reviews_count: 52,
      guru_rating: 4.8,
      guru_reviews_count: 17,
      courses: [{ id: 'c_rules', name: 'Prop Firm Rules 101', whop_url: 'https://whop.com/', image_url: 'https://picsum.photos/seed/prop/640/360', price_cents: 2999 }],
    },
  ]

    const tx = db.transaction(() => {
      for (const g of gurus) {
        insertGuru.run(
          g.id,
          g.name,
          g.handle,
          g.category,
          g.bio,
          g.whop_url,
          g.image_url,
          g.twitter_url,
          g.youtube_url,
          g.tiktok_url,
          g.instagram_url,
          g.website_url,
          g.verified,
          g.whop_rating,
          g.whop_reviews_count,
          g.guru_rating,
          g.guru_reviews_count,
          ts,
          ts
        )
        for (const c of g.courses) {
          insertCourse.run(c.id, g.id, c.name, c.whop_url, c.image_url, c.price_cents, ts, ts)
        }
      }
    })
    tx()

    db.exec('COMMIT')
  } catch (e) {
    try {
      db.exec('ROLLBACK')
    } catch {}
    throw e
  }
}

// run migrations + seed on first import
migrate()
seed()
