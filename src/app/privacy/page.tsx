import Link from "next/link";

export const metadata = { title: "Privacy Policy — StudyTool" };

export default function PrivacyPage() {
  const updated = "8 April 2025";

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-slate-700">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8 inline-block">
        ← Back to StudyTool
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-10">Last updated: {updated}</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">1. Who we are</h2>
          <p>
            StudyTool is operated by Sven (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). If you have questions about this policy, contact us at{" "}
            <a href="mailto:privacy@studytool.app" className="text-indigo-600 hover:underline">privacy@studytool.app</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">2. What data we collect</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-600">
            <li><strong>Account data</strong>: email address and hashed password when you register.</li>
            <li><strong>Study content</strong>: PDFs you upload, extracted topics, and study plans you create. This content is stored solely to provide the service to you.</li>
            <li><strong>Usage data</strong>: plan and course counts used to enforce free-tier limits.</li>
            <li><strong>Payment data</strong>: if you subscribe to Premium, Stripe processes your payment. We store only your Stripe customer ID and subscription status — never your card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">3. How we use your data</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-600">
            <li>To provide and improve the StudyTool service.</li>
            <li>To send transactional emails (email confirmation, password reset). We do not send marketing emails without your explicit opt-in.</li>
            <li>To enforce plan limits and process subscription payments.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">4. Third-party processors</h2>
          <p className="text-slate-600 mb-2">We use the following sub-processors. By using StudyTool you acknowledge that your data may be processed by these services:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-600">
            <li><strong>Supabase</strong> — database, authentication, and file storage (EU region).</li>
            <li><strong>Anthropic</strong> — your uploaded PDF text is sent to Claude to extract study topics. Anthropic does not use this data to train models by default.</li>
            <li><strong>Stripe</strong> — payment processing for Premium subscriptions.</li>
            <li><strong>Vercel</strong> — hosting and edge network.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">5. Your rights (GDPR)</h2>
          <p className="text-slate-600 mb-2">If you are in the EU/EEA you have the right to access, rectify, or erase your personal data. You can:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-600">
            <li>Export all your data as JSON from your <Link href="/account" className="text-indigo-600 hover:underline">Account</Link> page.</li>
            <li>Delete your account and all associated data permanently from your <Link href="/account" className="text-indigo-600 hover:underline">Account</Link> page.</li>
            <li>Contact us at <a href="mailto:privacy@studytool.app" className="text-indigo-600 hover:underline">privacy@studytool.app</a> for any other requests.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">6. Cookies</h2>
          <p className="text-slate-600">
            We use a single session cookie to keep you logged in. We do not use tracking or advertising cookies. No third-party analytics scripts are loaded.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">7. Data retention</h2>
          <p className="text-slate-600">
            Your data is retained for as long as your account is active. When you delete your account, all personal data including uploaded files, topics, and plans is permanently deleted within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">8. Changes to this policy</h2>
          <p className="text-slate-600">
            We may update this policy occasionally. We will notify you by email for material changes. Continued use of the service after changes constitutes acceptance.
          </p>
        </section>
      </div>
    </main>
  );
}
