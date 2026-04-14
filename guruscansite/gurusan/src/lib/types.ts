export type DbGuru = {
  id: string
  name: string
  handle: string | null
  category: string
  bio: string | null
  whop_url: string | null
  image_url: string | null
  twitter_url: string | null
  youtube_url: string | null
  tiktok_url: string | null
  instagram_url: string | null
  website_url: string | null
  creator_name: string | null
  brand_name: string | null
  creator_image_url: string | null
  creator_id: string | null
  verified: number
  whop_rating: number | null
  whop_reviews_count: number | null
  whop_star_counts: string | null
  whop_route: string | null
  whop_synced_at: number | null
  guru_rating: number | null
  guru_reviews_count: number | null
  claimed_by: string | null
  claimed_at: number | null
  created_at: number
  updated_at: number
}

export type DbCourse = {
  id: string
  guru_id: string
  name: string
  whop_url: string | null
  image_url: string | null
  price_cents: number | null
  whop_rating: number | null
  whop_reviews_count: number | null
  whop_star_counts: string | null
  summary: string | null
  whop_synced_at: number | null
  created_at: number
  updated_at: number
}

export type DbUser = {
  id: string
  username: string
  email: string | null
  password_hash: string
  created_at: number
  updated_at: number
}

export type DbCreator = {
  id: string
  name: string
  slug: string
  bio: string | null
  image_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  twitter_url: string | null
  website_url: string | null
  created_at: number
  updated_at: number
}
