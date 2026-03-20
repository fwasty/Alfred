# GuruScan UX Research Report
## Competitive Analysis: Review & Rating Directory Sites

*Researched: March 19, 2026*

---

## Table of Contents
1. [RateMyProfessors.com — Deep Dive](#1-ratemyprofessorscom)
2. [Trustpilot.com — Deep Dive](#2-trustpilotcom)
3. [G2.com — Deep Dive](#3-g2com)
4. [Cross-Platform UX Patterns & Best Practices](#4-cross-platform-patterns)
5. [Actionable Recommendations for GuruScan](#5-recommendations-for-guruscan)

---

## 1. RateMyProfessors.com

**What it is:** The dominant professor/instructor review platform. Simple, student-focused, used by millions to choose classes.

### Homepage Structure
- **Extremely minimal** — single search bar dominates the page
- Two entry points: "Enter your school to get started" OR "I'd like to look up a professor by name"
- CTA to join/sign up for account (manage ratings, like/dislike, anonymous posting)
- Footer with guidelines, legal, privacy
- **No clutter, no featured content, no news** — 100% search-oriented

**Key Insight:** The homepage exists to funnel users into search as fast as possible. Zero distractions.

### Search/Browse Page
- Results show card-based professor listings
- Each search result card contains:
  - **"QUALITY" score** (big number, e.g., 4.8)
  - **Total ratings count** (e.g., "160 ratings")
  - **Professor name** (bold)
  - **Department** (e.g., "Mathematics")
  - **University name**
  - **"% would take again"** (e.g., 93%)
  - **"Level of difficulty"** (e.g., 2.1)
- Filter by school ("Any" dropdown)
- "Don't see the professor? Add a Professor" CTA
- Shows total result count ("10,000 professors with 'smith' in their name")

**Key Insight:** Search results give you the three most important decision metrics at a glance (quality, take-again %, difficulty) without needing to click into each profile.

### Professor Profile Page
- **Header section:**
  - Overall Quality score (large, prominent)
  - Based on X ratings (linked to reviews list)
  - "% Would take again" stat
  - "Level of Difficulty" stat
  - "I'm Professor [Name]" claim link
- **Review list:**
  - Filter by course (dropdown)
  - Each review shows:
    - **Course code** (e.g., MATH1200)
    - **Date**
    - **Quality score** (per-review, 1-5)
    - **Difficulty score** (per-review, 1-5)
    - **Free-text comment**
    - **Tags** (e.g., "Amazing lectures", "Inspirational", "Respected", "Caring", "Graded by few things", "Test heavy", "Participation matters", "Clear grading criteria")
- No reply mechanism from professors (one-directional)
- No images, no media — text-only reviews

**Key Insight:** Tags are a killer UX pattern. They let users quickly scan what a professor is known for without reading every review. They're also great for filtering/aggregation.

### What Makes RMP Work
| Strength | Detail |
|----------|--------|
| **Simplicity** | No feature bloat. Search → Profile → Reviews. Done. |
| **Glanceable metrics** | Quality, Would Take Again %, Difficulty — the three things students actually care about |
| **Tags/Labels** | Community-generated tags on each review provide scannable summaries |
| **Anonymous reviews** | Encourages honest feedback |
| **Course-level filtering** | Can drill into reviews for a specific course |
| **Minimal friction** | No lengthy sign-up required to browse |

### What RMP Gets Wrong
- **No rating distribution chart** (can't see how many 5s vs 1s)
- **No "helpful" voting on reviews** (can't surface best reviews)
- **No AI summary** of reviews
- **Outdated visual design** — functional but dated
- **No professor response/rebuttal** mechanism
- **No verification** that reviewer actually took the class

---

## 2. Trustpilot.com

**What it is:** The world's leading business review platform. Open to anyone. Covers all industries.

### Homepage Structure
- **Search bar** at top (search for businesses)
- "Looking to grow your business?" CTA for business owners
- "Best in [Category]" awards/highlights (e.g., "Best in Bank", "Best in Travel Insurance")
- "We're Trustpilot" mission statement — emphasis on trust, openness, transparency
- **Recent reviews feed** — showing real-time activity (builds social proof)
- Clean, green brand color (green = trust)
- Links to Trust Report

**Key Insight:** Homepage balances two audiences: consumers looking for reviews AND businesses wanting to manage reputation. The real-time review feed creates a sense of living, active community.

### Business Profile Page (e.g., amazon.com)
- **Header:**
  - Business name + logo
  - **Total review count** (e.g., "44,564")
  - **TrustScore** (numeric, e.g., 1.7)
  - Star rating visualization
  - Link to business website
- **AI-generated review summary** — Natural language paragraph summarizing what reviewers say (huge UX win)
- **Company details:**
  - Category tags (e.g., "Book Store", "Clothing Store", "Hobby Store")
  - Description (from external sources)
  - Contact info / location
- **Review stream:**
  - Each review shows:
    - **Reviewer name** (linked to their profile)
    - **Star rating** (1-5 stars)
    - **Review title** (bold, clickable)
    - **Full review text**
    - **Date**
    - **Labels**: "Unprompted review" vs "Verified" vs "Invited"
    - Time since posted (e.g., "41 minutes ago")
  - Pagination at bottom
- **Trust section at bottom:**
  - "Anyone can write a Trustpilot review"
  - "Companies can ask for reviews via automatic invitations"
  - "We use dedicated people and clever technology to safeguard our platform"
  - "Verification can help ensure real people are writing reviews"
  - Link to Trust Center

**Key Insight:** The AI review summary is a game-changer. Instead of reading 44,000 reviews, you get the gist in one paragraph. The trust/transparency messaging woven throughout builds credibility.

### TrustScore System
- Calculated from: number of reviews, recency weighting, and a baseline of 7 phantom reviews at 3.5 stars (so new businesses start neutral, not at 5.0)
- Star ranges: 1.0-1.8 = Bad, 1.8-2.6 = Poor, 2.6-3.4 = Average, 3.4-4.2 = Great, 4.2-5.0 = Excellent
- Newer reviews weighted more heavily
- Displayed prominently at top of every profile

**Key Insight:** The TrustScore's phantom review baseline is clever — it prevents gaming by new businesses creating a few fake 5-star reviews. GuruScan should consider a similar mechanism.

### What Makes Trustpilot Work
| Strength | Detail |
|----------|--------|
| **AI review summaries** | Instant understanding without reading every review |
| **Review labels** | "Verified", "Unprompted", "Invited" — transparency about review source |
| **Real-time activity** | Recent reviews feed creates living community feel |
| **Trust messaging** | Constant reinforcement of platform integrity |
| **Two-sided platform** | Businesses can claim profiles, respond, invite reviews |
| **Category taxonomy** | Businesses tagged into browsable categories |
| **Green branding** | Color psychology — green = trust, safety |
| **Open platform** | Anyone can review anything — low barrier |
| **TrustScore algorithm** | Sophisticated, transparent, recency-weighted scoring |

### What Trustpilot Gets Wrong
- **No rating distribution chart** on the profile page header (have to dig)
- **No attribute-level ratings** (just one overall score)
- **Long review text** can be overwhelming without filtering
- **No "helpful" upvote** system visible on reviews
- **Category browsing** is secondary to search

---

## 3. G2.com

**What it is:** The largest B2B software review marketplace. Used by 80M+ people/year. Built for enterprise software buyers.

### Homepage Structure
- Search bar for software categories/products
- Category grid navigation (AI, Sales, Marketing, HR, IT, Finance, etc.)
- Trending/featured products
- Social proof stats ("3M+ reviews", "140,000+ products")
- Heavy JS — requires full browser to render

### Product Page Structure
- **Header:**
  - Product name + logo
  - Overall star rating (decimal, e.g., 4.5)
  - Total review count
  - G2 Grid® quadrant badge (Leader, High Performer, Contender, Niche)
- **Key metrics dashboard:**
  - **Ease of Use** score
  - **Ease of Setup** score
  - **Quality of Support** score
  - Individual feature ratings
- **Side-by-side comparison** — alternatives shown on same page
- **Pricing information**
- **Review section:**
  - Each review contains:
    - **Star rating**
    - **"What do you like best?"** (structured positive)
    - **"What do you dislike?"** (structured negative)
    - **"What problems is [product] solving?"** (use case context)
    - **Reviewer details**: job title, company size, industry, region
    - **Screenshot verification badge** ("Verified Current User")
    - **Date**
    - **Incentive disclosure** (if applicable)
  - Pros and cons compiled from reviews, grouped into themes
- **Q&A section** — community questions and answers about the product
- **Category Grid®** — visual quadrant showing market position vs. competitors

### G2 Grid® Methodology
- Two axes: **Customer Satisfaction** (from reviews) × **Market Presence** (market share, vendor size)
- Four quadrants: Leaders, High Performers, Contenders, Niche
- Updated quarterly
- Category-specific — every software category gets its own Grid

### Verification & Trust
- Multi-step: business email validation + optional LinkedIn verification
- Screenshot verification for "Verified Current User" badge
- Manual human moderation of every review
- Conflict of interest checks
- Anti-spam + AI content detection
- Incentivized reviews labeled transparently
- Same payment regardless of positive/negative feedback
- Review freshness: automated 6-month update requests to reviewers

**Key Insight:** G2's structured review format ("What do you like / dislike / what problems does it solve") produces much higher quality reviews than free-text. The reviewer context (job title, company size, industry) helps readers find people "like them."

### What Makes G2 Work
| Strength | Detail |
|----------|--------|
| **Structured review format** | "Like/Dislike/Problems Solved" produces useful reviews |
| **Rich reviewer context** | Job title, company size, industry visible on each review |
| **Attribute-level ratings** | Ease of Use, Setup, Support rated individually |
| **Grid® quadrant system** | Unique visual positioning that becomes an industry standard |
| **Side-by-side comparisons** | Alternatives on same page, reduce tab-switching |
| **Screenshot verification** | Proves reviewer actually uses the product |
| **Review freshness** | 6-month re-review prompts keep data current |
| **Deep category taxonomy** | 10+ top-level categories, hundreds of sub-categories |
| **Themed pros/cons** | AI groups feedback into themes for quick scanning |

### What G2 Gets Wrong
- **Slow mobile experience** (heavy pages, comparison charts struggle on mobile)
- **Review quality inconsistency** (some reviews very brief despite structured format)
- **Enterprise-focused** — can feel intimidating for casual users
- **JS-heavy** — poor accessibility, SEO challenges for crawlers

---

## 4. Cross-Platform UX Patterns & Best Practices

### Universal Patterns That Work

#### 1. Search-First Homepage
All three sites lead with search. The homepage's #1 job is to get users to the entity they're looking for.

#### 2. Glanceable Aggregate Scores
- RMP: Quality score + Would Take Again % + Difficulty
- Trustpilot: TrustScore + Star rating + Review count
- G2: Star rating + Grid quadrant + Feature scores

**Best practice:** Show 2-4 key metrics at the top of every profile, before any review content.

#### 3. Social Proof Through Volume
All platforms prominently display total review counts. "160 ratings" or "44,564 reviews" — volume = credibility.

#### 4. Review Recency Indicators
All show dates and relative timestamps ("41 minutes ago"). Fresh reviews signal an active, relevant platform.

#### 5. Structured Review Prompts
- RMP: Quality + Difficulty + Tags + Comment
- Trustpilot: Star rating + Title + Full review
- G2: Star rating + Like/Dislike/Problems Solved + Feature ratings + Screenshots

**Best practice:** The more structured the review form, the higher quality the output. G2's approach is best.

#### 6. Trust & Verification Signals
- Trustpilot: Verified/Unprompted labels, Trust Center
- G2: Verified Current User badge, screenshot verification, LinkedIn validation
- RMP: Anonymous reviews (trust through honesty)

### Key UX Research Findings (from Smashing Magazine / Baymard)

1. **95% of users rely on reviews** to make decisions
2. **Always show decimal ratings** (4.3, not "4 stars") — more granular = more trustworthy
3. **Always show total number of reviews** alongside the score
4. **Rating distribution charts** (bar chart showing 5★/4★/3★/2★/1★ breakdown) are critical — users look for "J-shaped distribution" (lots of 5s, some 1s, flat middle)
5. **Break ratings by attributes** (quality, difficulty, value, etc.) — don't rely on one overall number
6. **"Helpful" voting** on reviews surfaces the best content (Amazon, Glossier do this well)
7. **Negative reviews increase trust** — a product with ONLY 5-star reviews looks fake
8. **Tags/labels for quick scanning** — saves users from reading every word
9. **Reviewer context** (who they are) helps readers find "people like me"

---

## 5. Actionable Recommendations for GuruScan

### A. Information Architecture

#### Homepage: Search-First, Zero Friction
- **Hero: Giant search bar** — "Search for a guru, course, or mentor"
- Secondary entry: "Browse by category" with visual category cards
- Social proof bar: "X gurus rated • Y reviews written • Z users"
- Recent activity feed (like Trustpilot) — shows platform is alive
- Don't clutter with marketing — the homepage IS the product

#### Profile Pages: The Money Page
Every guru profile should have these sections, in this order:

1. **Header Hero:**
   - Guru name + photo/avatar
   - Overall "GuruScore" (decimal, e.g., 4.3/5.0)
   - Total review count
   - Star visualization
   - 2-3 key attribute scores (e.g., "Content Quality: 4.7", "Value for Money: 3.8", "Responsiveness: 4.2")
   - "% Would Recommend" stat (RMP's "Would Take Again" is brilliant — steal this)
   - Category/niche tags (e.g., "Day Trading", "Options", "Crypto")
   - Platform links (YouTube, Discord, Twitter, course site)

2. **AI Review Summary** (steal from Trustpilot)
   - 2-3 sentence natural-language summary of what reviewers say
   - Generated from review corpus, updated regularly
   - Highlights both strengths AND common complaints

3. **Rating Distribution Chart**
   - Horizontal bar chart: 5★/4★/3★/2★/1★ breakdown
   - Clickable — filter reviews by star level
   - Show count for each level

4. **Attribute Breakdown**
   - Individual scores for key dimensions:
     - **Content Quality** — Is the material good?
     - **Value for Money** — Worth the price?
     - **Responsiveness** — Do they engage with students?
     - **Transparency** — Honest about results/track record?
     - **Community** — Quality of Discord/group/etc.
   - Bar visualization for each

5. **Reviews Stream**
   - Each review shows:
     - Star rating + date + relative time
     - **Structured format**: "What I liked" / "What could be better" / "My experience" (steal from G2)
     - Reviewer context: trading experience level, what product they used, how long they've been a member
     - Tags (e.g., "Great for Beginners", "Expensive", "Active Discord", "Profitable Strategies")
     - "Helpful" upvote button + count
     - Verification badge (if we can verify purchase/membership)
   - Sort by: Most recent, Most helpful, Highest rated, Lowest rated
   - Filter by: Star rating, Product/course, Tags

6. **Comparison Widget**
   - "Compare with similar gurus" (like G2's side-by-side)
   - Show 2-3 alternatives with their scores

7. **Claim This Profile CTA**
   - For gurus to claim and manage their listing

### B. Trust & Verification System

| Signal | Implementation |
|--------|---------------|
| **Verified Purchase** | Integrate with course platforms (Teachable, Gumroad, Discord) to verify reviewer actually bought/subscribed |
| **Review Labels** | "Verified Member", "Unprompted", "Invited" — transparent about source |
| **GuruScore Algorithm** | Use phantom review baseline (like Trustpilot) — new gurus start at neutral, not 5.0 |
| **Recency Weighting** | Recent reviews count more — gurus can improve (or decline) over time |
| **Review Freshness** | Prompt reviewers every 6 months to update (like G2) |
| **Conflict of Interest** | Detect and flag reviews from affiliates/associates |
| **AI Fake Review Detection** | Automated scanning for patterns (language similarity, timing, etc.) |
| **Trust Center** | Dedicated page explaining how GuruScan ensures review integrity |

### C. Review Collection UX

#### Structured Review Form (Critical)
Don't let users write a blob of text. Use G2's approach:

```
1. Overall Rating: ★★★★★ (1-5)
2. What did you like best about [Guru Name]?  [text field]
3. What could be improved?  [text field]
4. Describe your experience:  [text field]
5. Attribute Ratings:
   - Content Quality: ★★★★★
   - Value for Money: ★★★★★
   - Responsiveness: ★★★★★
   - Transparency: ★★★★★
   - Community: ★★★★★
6. Would you recommend? [Yes/No]
7. Tags (select all that apply):
   □ Great for Beginners  □ Advanced Strategies  □ Active Community
   □ Good Value  □ Overpriced  □ Responsive  □ Profitable
   □ Educational  □ Entertaining  □ Transparent  □ Hype-heavy
8. Your trading experience: [Beginner / Intermediate / Advanced]
9. Product used: [Course / Discord / Signals / Mentorship / YouTube]
10. How long have you been a member? [dropdown]
```

### D. Tags & Quick-Scan System

Steal RMP's tag system and make it better:

**Positive tags:** Great for Beginners, Advanced Strategies, Active Community, Good Value, Responsive, Profitable, Educational, Transparent, Entertaining, Real Track Record

**Neutral tags:** Hype-Heavy, Entertainment-Focused, Beginner-Only, US Markets Only, Crypto-Focused, Forex-Focused, Futures-Focused, Options-Focused

**Warning tags:** Overpriced, Unresponsive, No Track Record, Misleading Claims, Affiliate-Heavy

Display as colored chips on profiles — aggregate the most common tags at the top of each profile.

### E. Visual Design & Branding

| Principle | Application |
|-----------|------------|
| **Trust color** | Use green or blue as primary (avoid red/orange which signal danger). Trustpilot's green works. |
| **Clean typography** | Large, readable scores. Decimal numbers. Sans-serif. |
| **White space** | Don't cram — let the data breathe |
| **Consistent card design** | Every guru card in search results should show: Photo + Score + Review Count + Category + Top Tags + Would Recommend % |
| **Mobile-first** | Design for phone first. Cards stack well. Scores are tappable. Reviews scroll infinitely. |
| **Dark mode** | Traders live in dark mode (TradingView, broker platforms). Offer it. |

### F. Category Taxonomy for Finance Gurus

```
├── Day Trading
│   ├── Futures (NQ, ES, etc.)
│   ├── Options
│   ├── Equities
│   └── Scalping
├── Swing Trading
├── Crypto / DeFi
├── Forex
├── Investing (Long-term)
├── Real Estate Investing
├── Prop Firm Education
├── Trading Psychology
├── Technical Analysis
├── Options Strategies
├── Algorithmic / Quant
├── Financial Literacy
├── Online Business / Side Hustles
├── Course Creators / Educators
└── Signal Services
```

### G. Differentiation: What GuruScan Should Do That Others Don't

1. **Track Record Verification** — The killer feature. Can the guru prove their P&L? Integrate with broker statement uploads. A "Verified Track Record" badge would be the ultimate trust signal in this space.

2. **"Guru Score" with Decay** — If a guru stops producing content or goes silent, their score should gradually decay. Finance gurus come and go — the score should reflect current relevance.

3. **Price Transparency Index** — Aggregate and display what each guru charges (course price, Discord monthly, mentorship rate). Let users compare value.

4. **Red Flag Alerts** — Automated detection of common scam patterns (unrealistic return claims, pressure tactics, fake screenshots). Surface warnings.

5. **Community Sentiment Tracker** — Track sentiment over time. Show a graph: "This guru's reviews have been trending [up/down] over the past 6 months."

6. **Social Proof Integration** — Pull follower counts, engagement rates from social platforms. Don't make it the score, but display it as context.

7. **"People Also Reviewed" / Related Gurus** — Collaborative filtering. "Users who reviewed Guru X also reviewed Guru Y."

### H. Mobile-First Design Priorities

Based on G2's known weakness (slow on mobile) and the target demographic (Gen Z traders on phones):

1. **Infinite scroll** for reviews (not pagination)
2. **Bottom navigation bar** (Search, Browse, Write Review, Profile)
3. **Swipeable comparison cards** — swipe left/right to compare gurus
4. **One-tap star rating** — make reviewing dead simple on mobile
5. **Score badges as shareable graphics** — let users share guru scores to Twitter/TikTok
6. **Sub-2 second load times** — no heavy JS frameworks, use SSR/SSG
7. **Sticky score header** — when scrolling reviews, the guru's score stays visible

---

## Summary: Priority Implementation Order

| Priority | Feature | Inspiration |
|----------|---------|------------|
| 🔴 P0 | Search-first homepage | RMP |
| 🔴 P0 | Profile page with aggregate score + attribute breakdown | G2 + RMP hybrid |
| 🔴 P0 | Structured review form | G2 |
| 🔴 P0 | Rating distribution chart | Industry standard |
| 🟡 P1 | Tags/labels system | RMP |
| 🟡 P1 | AI review summary | Trustpilot |
| 🟡 P1 | "Would Recommend %" metric | RMP's "Would Take Again" |
| 🟡 P1 | Verification badges | G2 + Trustpilot |
| 🟡 P1 | Trust Center page | Trustpilot |
| 🟢 P2 | Comparison widget | G2 |
| 🟢 P2 | Helpful vote system | Amazon/G2 |
| 🟢 P2 | Sentiment trend graph | Original |
| 🟢 P2 | Track record verification | Original (killer feature) |
| 🟢 P2 | Price transparency index | Original |
| 🔵 P3 | Dark mode | Original |
| 🔵 P3 | Guru score decay | Original |
| 🔵 P3 | Red flag alerts | Original |
| 🔵 P3 | Social proof integration | Original |

---

*This research should give a clear UX foundation. The best review sites share common DNA: search-first, glanceable scores, structured reviews, trust signals, and transparency. GuruScan's opportunity is to apply these proven patterns to a niche (finance gurus) that desperately needs them.*
