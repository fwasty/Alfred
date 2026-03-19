function extractHandle(url?: string | null) {
  if (!url) return null
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    if (!parts.length) return null
    // TikTok can be /@handle
    const last = parts[0].startsWith('@') ? parts[0].slice(1) : parts[0]
    return last || null
  } catch {
    return null
  }
}

export function pickCreatorAt(guru: {
  instagram_url?: string | null
  tiktok_url?: string | null
  youtube_url?: string | null
  twitter_url?: string | null
}) {
  const ig = extractHandle(guru.instagram_url)
  const tt = extractHandle(guru.tiktok_url)
  const yt = extractHandle(guru.youtube_url)
  const x = extractHandle(guru.twitter_url)

  const h = ig || tt || yt || x
  if (!h) return null
  return '@' + h.replace(/^@/, '')
}
