export type WhopCompanyIngest = {
  whop_url: string
  route: string | null
  company_id: string | null
  title: string | null
  creator_pitch: string | null
  logo_url: string | null
  reviews_average: number | null
  published_reviews_count: number | null
  review_counts: number[] | null
  socials: {
    instagram_url: string | null
    tiktok_url: string | null
    youtube_url: string | null
    twitter_url: string | null
    website_url: string | null
  }
  access_passes: Array<{
    product_id: string
    title: string | null
    headline: string | null
    shortened_description: string | null
    image_url: string | null
    initial_price_due_cents: number | null
    formatted_period: string | null
    whop_route: string | null
    reviews_average: number | null
    published_reviews_count: number | null
    review_counts: number[] | null
    summary: string | null
  }>
}

function unescapeEmbeddedJson(s: string) {
  // The store page contains JSON-ish chunks with escaped quotes like \"...
  // Convert to normal JSON.
  return s.replace(/\\"/g, '"')
}

function extractBracketed(raw: string, startIdx: number, open: string, close: string) {
  let i = startIdx
  while (i < raw.length && raw[i] !== open) i++
  if (i >= raw.length) return null
  let depth = 0
  const begin = i
  for (; i < raw.length; i++) {
    const ch = raw[i]
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) {
        return raw.slice(begin, i + 1)
      }
    }
  }
  return null
}

function rx1(raw: string, re: RegExp) {
  const m = raw.match(re)
  return m?.[1] ?? null
}

function makeSummary(input: {
  title: string | null
  headline: string | null
  desc: string | null
  highlights?: string[]
}) {
  const parts: string[] = []
  const t = input.headline || input.title
  if (t) parts.push(t.trim())
  if (input.desc) parts.push(input.desc.trim())
  if (input.highlights?.length) parts.push(`Highlights: ${input.highlights.slice(0, 4).join(' • ')}`)
  const txt = parts.join(' — ').replace(/\s+/g, ' ').trim()
  return txt.length ? txt.slice(0, 420) : null
}

export async function ingestWhopCompanyFromPublicUrl(whopUrl: string): Promise<WhopCompanyIngest> {
  const res = await fetch(whopUrl, {
    headers: {
      // mimic a normal browser
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
  })
  let html = await res.text()

  // Normalize /joined/ URLs to canonical via og:url when available.
  // Some joined pages don't contain the embedded JSON we need.
  const ogUrl = rx1(html, /property=["']og:url["'][^>]+content=["']([^"']+)["']/i) ||
    rx1(html, /content=["']([^"']+)["'][^>]+property=["']og:url["']/i)

  if (ogUrl && ogUrl !== whopUrl && !/\/joined\//.test(ogUrl)) {
    try {
      const res2 = await fetch(ogUrl, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml',
        },
        cache: 'no-store',
      })
      html = await res2.text()
      whopUrl = ogUrl
    } catch {
      // ignore
    }
  }

  // company blob
  const company_id =
    rx1(html, /company\\":\{[^}]*?id\\":\\"(biz_[^\\"]+)/) ||
    rx1(html, /"company":\{[^}]*?"id":"(biz_[^"]+)/)

  const routeFromUrl = (() => {
    try {
      const u = new URL(whopUrl)
      const seg = u.pathname.split('/').filter(Boolean)[0]
      return seg || null
    } catch {
      return null
    }
  })()

  const route =
    rx1(html, /company\\":\{[^}]*?route\\":\\"([^\\"]+)/) ||
    rx1(html, /"company":\{[^}]*?"route":"([^"]+)/) ||
    routeFromUrl

  const title =
    rx1(html, /company\\":\{[^}]*?title\\":\\"([^\\"]+)/) ||
    rx1(html, /"company":\{[^}]*?"title":"([^"]+)/) ||
    // Fallbacks: some pages omit a clean company blob, but still include OG/title tags.
    rx1(html, /property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    rx1(html, /content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
    rx1(html, /<title>([^<]+)<\/title>/i)

  const creator_pitch =
    rx1(html, /creatorPitch\\":\\"([^\\"]+)/) ||
    rx1(html, /"creatorPitch":"([^"]+)/)

  const reviews_average = (() => {
    const v = rx1(html, /reviewsAverage\\":(\d+(?:\.\d+)?)/) || rx1(html, /"reviewsAverage":(\d+(?:\.\d+)?)/)
    return v ? Number(v) : null
  })()

  const published_reviews_count = (() => {
    const v = rx1(html, /publishedReviewsCount\\":(\d+)/) || rx1(html, /"publishedReviewsCount":(\d+)/)
    return v ? Number(v) : null
  })()

  const og_image =
    rx1(html, /property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    rx1(html, /content=["']([^"']+)["'][^>]+property=["']og:image["']/i)

  // Whop pages often include a clean square icon (preferred) in <link rel="icon">.
  // This is usually better than og:image (which can be a huge banner with lots of text).
  const icon_href =
    rx1(html, /rel=["']icon["'][^>]*href=["']([^"']+)["']/i) ||
    rx1(html, /href=["']([^"']+)["'][^>]*rel=["']icon["']/i) ||
    rx1(html, /rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i) ||
    rx1(html, /href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i)

  const iconOk = (() => {
    if (!icon_href) return false
    const u = String(icon_href)
    if (u.includes('img-v2-prod.whop.com/')) return true
    if (u.includes('assets.whop.com/uploads/')) return true
    if (u.includes('assets-') && u.includes('.whop.com/uploads/')) return true
    return false
  })()

  // Only accept og:image as a logo if it looks like a real logo/asset URL.
  // Some Whop pages return banner/preview images (text/description) which look terrible as avatars.
  const ogOk = (() => {
    if (!og_image) return false
    const u = String(og_image)
    if (u.includes('/discover/')) return false
    if (u.includes('/marketplace/')) return false
    if (u.includes('/reviews/')) return false
    if (u.includes('/joined/')) return false

    // Allowlist known-good asset hosts/patterns
    if (u.includes('assets-') && u.includes('.whop.com/uploads/')) return true
    if (u.includes('assets.whop.com/uploads/')) return true

    // Core biz_ images are often banners; allow only as a last resort.
    if (u.includes('whop.com/core/images/whop/i/biz_')) return true
    return false
  })()

  const embeddedLogo =
    rx1(html, /logo\\":\{\\"sourceUrl\\":\\"(https:[^\\"]+)/) ||
    rx1(html, /"logo":\{"sourceUrl":"(https:[^"]+)/)

  const logo_url = (iconOk ? icon_href : null) || embeddedLogo || (ogOk ? og_image : null)

  const review_counts = (() => {
    const v = rx1(html, /reviewCounts\\":\[(\d+(?:,\d+){4})\]/) || rx1(html, /"reviewCounts":\[(\d+(?:,\d+){4})\]/)
    return v ? v.split(',').map((n) => Number(n.trim())) : null
  })()

  // accessPasses array (products)
  const apIdx = html.indexOf('accessPasses')
  let access_passes: WhopCompanyIngest['access_passes'] = []
  if (apIdx !== -1) {
    const arr = extractBracketed(html, apIdx, '[', ']')
    if (arr) {
      try {
        const json = JSON.parse(unescapeEmbeddedJson(arr)) as any[]
        access_passes = (json || []).map((p) => {
          const dp = p?.defaultPlan
          const highlights: string[] = (p?.productHighlights?.nodes || [])
            .map((n: any) => (typeof n?.content === 'string' ? n.content : null))
            .filter(Boolean)

          const reviews_average =
            typeof p?.reviewsAverage === 'number'
              ? p.reviewsAverage
              : typeof dp?.reviewsAverage === 'number'
                ? dp.reviewsAverage
                : null
          const published_reviews_count =
            typeof p?.publishedReviewsCount === 'number'
              ? p.publishedReviewsCount
              : typeof dp?.publishedReviewsCount === 'number'
                ? dp.publishedReviewsCount
                : null
          const review_counts = Array.isArray(p?.reviewCounts)
            ? p.reviewCounts.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))
            : Array.isArray(dp?.reviewCounts)
              ? dp.reviewCounts.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))
              : null

          const title = p?.title ?? null
          const headline = p?.headline ?? null
          const shortened_description = p?.shortenedDescription ?? null

          return {
            product_id: String(p?.id || ''),
            title,
            headline,
            shortened_description,
            image_url: p?.filePicture?.sourceUrl ?? p?.image?.sourceUrl ?? null,
            initial_price_due_cents:
              typeof dp?.initialPriceDueInCents === 'number' ? dp.initialPriceDueInCents : null,
            formatted_period: dp?.formattedPeriodV2 ?? null,
            whop_route: p?.route ?? null,
            reviews_average,
            published_reviews_count,
            review_counts,
            summary: makeSummary({ title, headline, desc: shortened_description, highlights }),
          }
        })
      } catch {
        // ignore parse errors for now; we still have top-level company fields
      }
    }
  }

  const socials = {
    instagram_url: rx1(html, /(https?:\\\/\\\/www\\.instagram\\.com\\\/[^\\"\s<]+)/) || rx1(html, /(https?:\\\/\\\/instagram\\.com\\\/[^\\"\s<]+)/),
    tiktok_url: rx1(html, /(https?:\\\/\\\/www\\.tiktok\\.com\\\/[^\\"\s<]+)/) || rx1(html, /(https?:\\\/\\\/tiktok\\.com\\\/[^\\"\s<]+)/),
    youtube_url: rx1(html, /(https?:\\\/\\\/www\\.youtube\\.com\\\/[^\\"\s<]+)/) || rx1(html, /(https?:\\\/\\\/youtube\\.com\\\/[^\\"\s<]+)/),
    twitter_url: rx1(html, /(https?:\\\/\\\/x\\.com\\\/[^\\"\s<]+)/) || rx1(html, /(https?:\\\/\\\/twitter\\.com\\\/[^\\"\s<]+)/),
    website_url: rx1(html, /(https?:\\\/\\\/[^\\"\s<]+\\.[a-z]{2,}[^\\"\s<]*?)(?:\\\/\\"|\\"|\s|<)/),
  }

  return {
    whop_url: whopUrl,
    route,
    company_id,
    title,
    creator_pitch,
    logo_url,
    reviews_average,
    published_reviews_count,
    review_counts,
    socials: {
      instagram_url: socials.instagram_url ? socials.instagram_url.replace(/\\\\\//g, '/') : null,
      tiktok_url: socials.tiktok_url ? socials.tiktok_url.replace(/\\\\\//g, '/') : null,
      youtube_url: socials.youtube_url ? socials.youtube_url.replace(/\\\\\//g, '/') : null,
      twitter_url: socials.twitter_url ? socials.twitter_url.replace(/\\\\\//g, '/') : null,
      website_url: socials.website_url ? socials.website_url.replace(/\\\\\//g, '/') : null,
    },
    access_passes,
  }
}
