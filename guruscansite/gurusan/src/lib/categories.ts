export const CATEGORIES = [
  'All',
  'Trading',
  'Ecom',
  'Crypto',
  'Sports Betting',
  'Clipping',
  'AI',
  'Agency',
  'Marketing',
  'Business',
  'Creator',
  'Real Estate',
  'Tools',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]
