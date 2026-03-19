export type YouTubeVideo = {
  id: string
  title: string
  url: string
  thumb: string
  publishedAt?: string
}

export async function fetchPlaylistVideos(playlistId: string, limit = 12): Promise<YouTubeVideo[]> {
  // YouTube's playlist Atom feed is unreliable in some environments.
  // Fall back to parsing the playlist HTML for videoIds.
  try {
    return await fetchPlaylistVideosFromHtml(playlistId, limit)
  } catch {
    return []
  }
}

export async function fetchChannelVideosRss(channelId: string, limit = 10): Promise<YouTubeVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
  return fetchYouTubeAtom(feedUrl, limit)
}

async function fetchPlaylistVideosFromHtml(playlistId: string, limit: number): Promise<YouTubeVideo[]> {
  const url = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 },
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'text/html,*/*;q=0.8',
    },
  })
  if (!res.ok) return []
  const html = await res.text()

  // Capture unique video ids from the initial data.
  const ids = new Set<string>()
  const re = /"videoId":"([a-zA-Z0-9_-]{11})"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    ids.add(m[1])
    if (ids.size >= limit) break
  }

  return [...ids].slice(0, limit).map((id) => ({
    id,
    title: 'YouTube video',
    url: `https://www.youtube.com/watch?v=${id}&list=${playlistId}`,
    // Try highest quality first (webp is usually crisper/smaller on mobile); component will fall back if it 404s.
    thumb: `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`,
  }))
}

async function fetchYouTubeAtom(feedUrl: string, limit: number): Promise<YouTubeVideo[]> {
  const res = await fetch(feedUrl, {
    // cache on the server for a bit so home stays fast
    next: { revalidate: 60 * 60 },
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!res.ok) return []
  const xml = await res.text()

  const entries = xml.split(/<entry>/g).slice(1)
  const out: YouTubeVideo[] = []

  for (const chunk of entries) {
    if (out.length >= limit) break

    const id = (chunk.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1]
    const title = (chunk.match(/<title>([^<]+)<\/title>/) || [])[1]
    const link = (chunk.match(/<link[^>]+href="([^"]+)"/) || [])[1]
    const publishedAt = (chunk.match(/<published>([^<]+)<\/published>/) || [])[1]

    if (!id || !title || !link) continue

    out.push({
      id,
      title: decodeXml(title),
      url: link,
      // Try highest quality first (webp is usually crisper/smaller on mobile); component will fall back if it 404s.
      thumb: `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`,
      publishedAt,
    })
  }

  return out
}

function decodeXml(s: string) {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}
