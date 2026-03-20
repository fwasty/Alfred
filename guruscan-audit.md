# GuruScan Code & Data Audit — March 19, 2026

## Critical Issues 🔴

### 1. Duplicate Courses Showing on Homepage
**15 gurus appear multiple times** in the trending carousel with near-identical courses. The dedup logic in `courses.ts` checks by `guru_id` but duplicates slip through because the same guru has multiple course entries with slightly different names/review counts.

Examples:
- **Divine**: "Divine" (4489 reviews) + "divine" (4477 reviews) — case difference
- **Hold My Hand Wholesale**: exact same name, 2070 vs 2069 reviews — likely duplicate DB entries
- **Wealth Group**: "wealthgroup" vs "Wealth Group" — naming inconsistency
- **Trust My System**: "TMS+ (Heavy Hitters) 🔨" appears twice (1694 vs 1693 reviews)
- **PJ Trades, GOAT Sports Bets, Shocked, Max Options Trading** — all duplicated

**Root cause**: Courses were seeded from multiple Whop scrape runs, creating near-duplicate entries with slightly different review counts.

### 2. 365 Gurus Categorized as "Whop" (40% of all visible gurus)
These have no real category — they were bulk-imported from Whop Discover without categorization. They show up in browse/search but can't be filtered properly.

### 3. Duplicate Guru Entries (15 pairs)
Same person/brand appearing as separate gurus with different handles:
- "Vanquish Holdings" → `vanquish-holdings` + `1-to-1-mentoring`
- "The Traveling Trader" → `the-traveling-trader` + `thetravelingtrader`
- "Master Day Trading" → `masterdaytrading` + `masterdaytrading-mentorship-program`
- "Stock Moe Academy" → `stock-moe-learner` + `stock-moe-academy`
- 11 more pairs

## Warnings 🟡

### 4. Overlapping/Inconsistent Categories
- **Ecom** (45) vs **E-Commerce** (8) — should be merged
- **Sports** (10) vs **Sports Betting** (17) vs **Sports Picks** (4) — should be consolidated
- **AI** (16) vs **AI / Agency** (4) — should be merged
- **814 courses have NO category** (NULL)
- **179 courses categorized as "Other"**

### 5. Courses Table has Category Column but It's Mostly Empty
Only 707 out of 1521 courses have a category assigned. The homepage carousel filtering relies on guru-level categories, not course-level.

### 6. No Hidden Column Check on Course Aliases
The `course_aliases` table has 0 entries — search for courses only works on exact name matches.

## Info ℹ️

### 7. Data Staleness
Last guru seeded: March 15 (4 days ago). No automated refresh pipeline.

### 8. Zero Users/Reviews
0 registered users, 0 user-generated reviews. The review system is built but untested in production.

### 9. Image Fallback Chain Works
0 gurus with missing images — the COALESCE fallback in queries (creator → guru → course image) is working.

### 10. No Orphan Courses
All courses have valid guru references.
