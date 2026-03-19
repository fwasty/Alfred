export function isBannedImageUrl(url?: string | null) {
  if (!url) return true
  const u = String(url).trim()
  if (!u) return true

  // Known bad/pointless placeholders
  if (u.includes('unavatar.io/instagram')) return true
  if (u.includes('picsum.photos')) return true

  // People sometimes paste generic instagram links as “image” by mistake
  if (/^https?:\/\/(www\.)?instagram\.com\//i.test(u)) return true

  // Whop pages that often produce banner/preview screenshots (text-y) when used as images
  if (u.includes('whop.com/discover/')) return true
  if (u.includes('whop.com/marketplace/')) return true
  if (u.includes('whop.com/reviews/')) return true
  if (u.includes('whop.com/joined/')) return true

  return false
}

export function pickImageUrl({
  primary,
  fallbacks = [],
  seed,
}: {
  primary?: string | null
  fallbacks?: Array<string | null | undefined>
  seed: string
}) {
  const candidates = [primary, ...fallbacks]
  for (const c of candidates) {
    if (!isBannedImageUrl(c)) return c as string
  }
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}`
}
