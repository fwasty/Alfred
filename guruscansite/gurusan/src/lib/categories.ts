export const CATEGORIES = [
  'All',
  'Futures',
  'Options',
  'Forex',
  'Crypto',
  'Stocks',
  'Sports Betting',
  'Ecom / Reselling',
  'AI / Automation',
  'Agency / Marketing',
  'Creator / TikTok Shop',
  'Fitness / Wellness',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]
