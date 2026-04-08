/** JSON-LD structured data for SEO — renders a <script type="application/ld+json"> tag */
export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function guruJsonLd(guru: {
  name: string
  handle: string | null
  bio: string | null
  image_url: string | null
  whop_rating: number | null
  whop_reviews_count: number | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: guru.name,
    description: guru.bio || `Reviews and ratings for ${guru.name}`,
    image: guru.image_url || undefined,
    url: `https://guruscan.xyz/gurus/${guru.handle}`,
    ...(guru.whop_rating != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: guru.whop_rating.toFixed(1),
            bestRating: '5',
            worstRating: '1',
            ratingCount: guru.whop_reviews_count || 1,
          },
        }
      : {}),
  }
}
