import { Shell } from '@/components/Shell'

export default function TermsPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text)]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">Last updated: March 28, 2026</p>

        <div className="mt-8 grid gap-6 text-sm text-[color:var(--muted)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">1. Acceptance</h2>
            <p className="mt-2">By using Guru Scan (guruscan.xyz), you agree to these terms. If you don't agree, please don't use the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">2. The Service</h2>
            <p className="mt-2">Guru Scan is an independent review and ratings platform for online courses and communities listed on Whop. We aggregate publicly available data (ratings, review counts) and host user-generated reviews. We are not affiliated with, endorsed by, or partnered with Whop or any guru listed on this site.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">3. User Accounts</h2>
            <ul className="mt-2 list-disc pl-5 grid gap-1">
              <li>You must be at least 13 years old to create an account</li>
              <li>You are responsible for keeping your login credentials secure</li>
              <li>One account per person — do not create multiple accounts to manipulate ratings</li>
              <li>We reserve the right to suspend accounts that violate these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">4. Reviews & Content</h2>
            <ul className="mt-2 list-disc pl-5 grid gap-1">
              <li><strong>Honesty:</strong> Reviews must reflect your genuine experience. Fake reviews (positive or negative) are prohibited.</li>
              <li><strong>No harassment:</strong> Do not post personal attacks, threats, doxxing, or discriminatory content.</li>
              <li><strong>No spam:</strong> Do not post promotional content, affiliate links, or irrelevant material in reviews.</li>
              <li><strong>Defamation:</strong> Express opinions, not false statements of fact. "I didn't find value" is fine. "This person is a criminal" (without evidence) is not.</li>
              <li><strong>One review per guru:</strong> You may update your review at any time, but cannot submit multiple reviews for the same guru.</li>
              <li><strong>License:</strong> By posting a review, you grant Guru Scan a non-exclusive license to display it on the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">5. Creator / Guru Rights</h2>
            <p className="mt-2">If you are a creator listed on Guru Scan:</p>
            <ul className="mt-2 list-disc pl-5 grid gap-1">
              <li>You may claim and verify your profile</li>
              <li>You may report reviews that violate these terms</li>
              <li>You may not pressure, incentivize, or threaten users to remove or change reviews</li>
              <li>We aim to be fair — our goal is transparency, not defamation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">6. Disclaimer</h2>
            <p className="mt-2">Guru Scan provides information for educational and informational purposes only. We do not endorse or recommend any guru, course, or trading strategy. User reviews represent individual opinions. Always do your own research before purchasing any course or joining any community.</p>
            <p className="mt-2"><strong>Not financial advice.</strong> Nothing on this site constitutes financial, investment, or trading advice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">7. Limitation of Liability</h2>
            <p className="mt-2">Guru Scan is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, reliance on reviews, or interactions with listed gurus/courses.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">8. Content Removal</h2>
            <p className="mt-2">We reserve the right to remove reviews, profiles, or content that violates these terms. Creators may submit removal/dispute requests which will be reviewed on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">9. Changes</h2>
            <p className="mt-2">We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">10. Contact</h2>
            <p className="mt-2">Questions or concerns? Reach out via X at <a href="https://x.com/fwasty" target="_blank" rel="noreferrer" className="underline underline-offset-2">@fwasty</a>.</p>
          </section>
        </div>
      </div>
    </Shell>
  )
}
