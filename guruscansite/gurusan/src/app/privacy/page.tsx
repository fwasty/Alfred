import { Shell } from '@/components/Shell'

export default function PrivacyPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">Last updated: March 28, 2026</p>

        <div className="mt-8 grid gap-6 text-sm text-[color:var(--muted)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">1. Information We Collect</h2>
            <p className="mt-2"><strong>Account Information:</strong> When you create an account, we collect your username, email address (optional), and password (stored as a bcrypt hash — we never see your actual password). If you sign in with Google, we receive your Google profile name and email.</p>
            <p className="mt-2"><strong>Reviews:</strong> When you submit a review, we store the content, rating, tags, and whether you chose to post anonymously.</p>
            <p className="mt-2"><strong>Usage Data:</strong> We may collect basic analytics such as page views and referral sources. We do not use tracking cookies or third-party advertising trackers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">2. How We Use Your Information</h2>
            <ul className="mt-2 list-disc pl-5 grid gap-1">
              <li>To provide and maintain the Guru Scan service</li>
              <li>To display your reviews (with your username or anonymously, as you choose)</li>
              <li>To calculate and display guru ratings</li>
              <li>To authenticate your account and prevent abuse</li>
              <li>To communicate with you about your account if needed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">3. Information Sharing</h2>
            <p className="mt-2">We do not sell, rent, or share your personal information with third parties for marketing purposes. Your reviews are publicly visible (unless posted anonymously). We may share information if required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">4. Data Sources</h2>
            <p className="mt-2">Guru and course information (names, ratings, review counts) is sourced from publicly available Whop pages. We are not affiliated with Whop. Review text from Whop is not copied — only aggregate ratings and counts are displayed.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">5. Cookies</h2>
            <p className="mt-2">We use a single session cookie (<code>gurusan_session</code>) to keep you logged in. This cookie is HTTP-only, secure, and does not track you across other websites. We also store your theme preference in localStorage.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">6. Data Security</h2>
            <p className="mt-2">We use industry-standard security measures including encrypted connections (HTTPS), hashed passwords (bcrypt), signed session tokens (HMAC-SHA256), and rate limiting on authentication endpoints.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">7. Your Rights</h2>
            <p className="mt-2">You can request deletion of your account and associated data by contacting us. You can update or delete your reviews at any time while logged in.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">8. Changes</h2>
            <p className="mt-2">We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">9. Contact</h2>
            <p className="mt-2">Questions about this policy? Reach out via X at <a href="https://x.com/fwasty" target="_blank" rel="noreferrer" className="underline underline-offset-2">@fwasty</a>.</p>
          </section>
        </div>
      </div>
    </Shell>
  )
}
