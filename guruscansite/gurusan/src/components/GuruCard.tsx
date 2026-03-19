import Link from 'next/link'
import { Badge, Card } from '@/components/ui'
import type { DbGuru } from '@/lib/types'
import { IconInstagram, IconLink, IconTikTok, IconX, IconYouTube } from '@/components/icons'
import { RatingBlock } from '@/components/RatingBlock'
import { pickImageUrl } from '@/lib/image'

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-xs text-neutral-700 hover:bg-black/5"
    >
      {children}
    </a>
  )
}

export function GuruCard({ guru }: { guru: DbGuru }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-5">
        {/* Mobile: stack so long names / categories never collide with rating blocks */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={pickImageUrl({ primary: guru.image_url, seed: guru.handle || guru.name || 'guru' })}
              alt={guru.name}
              className="size-12 shrink-0 rounded-2xl border border-black/10 bg-white object-cover"
            />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold leading-tight">{guru.name}</div>
              <div className="mt-1 truncate text-sm text-neutral-600">
                @{guru.handle ?? 'no-handle'} • {guru.category}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-2">
            <RatingBlock rating={guru.whop_rating} count={guru.whop_reviews_count} label="WHOP" />
            <RatingBlock rating={guru.guru_rating} count={guru.guru_reviews_count} label="GURU" />
          </div>
        </div>

        {guru.bio ? <div className="mt-3 text-sm text-neutral-700">{guru.bio}</div> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {guru.verified ? <Badge className="bg-sky-50">Verified</Badge> : null}
            {guru.category ? <Badge className="bg-white">{guru.category}</Badge> : null}
          </div>

          {guru.handle ? (
            <Link className="text-sm font-medium underline-offset-4 hover:underline" href={`/gurus/${guru.handle}`}>
              View profile →
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {guru.twitter_url ? (
            <SocialLink href={guru.twitter_url} label="X">
              <IconX className="size-3.5" /> X
            </SocialLink>
          ) : null}
          {guru.youtube_url ? (
            <SocialLink href={guru.youtube_url} label="YouTube">
              <IconYouTube className="size-3.5" /> YouTube
            </SocialLink>
          ) : null}
          {guru.tiktok_url ? (
            <SocialLink href={guru.tiktok_url} label="TikTok">
              <IconTikTok className="size-3.5" /> TikTok
            </SocialLink>
          ) : null}
          {guru.instagram_url ? (
            <SocialLink href={guru.instagram_url} label="Instagram">
              <IconInstagram className="size-3.5" /> IG
            </SocialLink>
          ) : null}
          {guru.website_url ? (
            <SocialLink href={guru.website_url} label="Website">
              <IconLink className="size-3.5" /> Site
            </SocialLink>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
