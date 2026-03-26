import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-surface-500 mb-10">Last updated: March 2026</p>

        <div className="prose prose-surface max-w-none space-y-8 text-surface-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              1. Who we are
            </h2>
            <p>
              MedFolio is an independent portfolio companion tool for UK junior doctors,
              operated as a sole trader business. MedFolio is not affiliated with, endorsed by,
              or connected to NHS England, Health Education England, any Royal College, or any
              NHS Trust.
            </p>
            <p className="mt-2">
              For data protection inquiries, contact us at:{' '}
              <strong>admin@medfolio.uk</strong>
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              2. What data we collect
            </h2>
            <p>We collect the following categories of personal data:</p>
            <p className="mt-3">
              <strong>Account data:</strong> Your name, email address, and password (stored as a
              cryptographic hash — we never see or store your actual password). Optionally: your
              training stage, primary specialty, and region.
            </p>
            <p className="mt-3">
              <strong>Portfolio data:</strong> Checklist items you track, their status and counts,
              notes you write, and evidence files you upload.
            </p>
            <p className="mt-3">
              <strong>Case journal data:</strong> Anonymised clinical case entries you create,
              including all fields you fill in (presenting complaint, diagnosis, learning points,
              reflections, etc.).
            </p>
            <p className="mt-3">
              <strong>Technical data:</strong> Your IP address, browser type, and pages visited
              are logged automatically by our hosting providers for security and performance
              purposes.
            </p>
            <p className="mt-3">
              <strong>Important — no patient data:</strong> MedFolio is designed to store only
              anonymised clinical information. You must not enter any patient-identifiable data.
              Our terms of service prohibit this, and the app includes anonymisation prompts
              to help you comply.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              3. Why we collect it and our lawful basis
            </h2>
            <p>Under UK GDPR, we process your data on the following lawful bases:</p>
            <p className="mt-3">
              <strong>Consent (Article 6(1)(a)):</strong> When you create an account, you
              consent to us processing your account, portfolio, and case journal data to provide
              the service. You can withdraw consent at any time by deleting your account.
            </p>
            <p className="mt-3">
              <strong>Legitimate interests (Article 6(1)(f)):</strong> We process technical
              data (server logs, error reports) to maintain the security and performance of the
              service. Our legitimate interest is ensuring the platform runs reliably and
              securely.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              4. How we store and protect your data
            </h2>
            <p>
              Your data is stored on servers located in <strong>London, United Kingdom</strong>{' '}
              (AWS eu-west-2 region), provided by Supabase Inc.
            </p>
            <p className="mt-3">Security measures include:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• AES-256 encryption of all data at rest</li>
              <li>• TLS 1.3 encryption of all data in transit</li>
              <li>• Bcrypt password hashing (your password is never stored in plain text)</li>
              <li>• Row Level Security — database-level enforcement ensuring users can only access their own data</li>
              <li>• Private file storage with time-limited signed URLs for file access</li>
              <li>• Daily automated database backups</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              5. Who we share your data with
            </h2>
            <p>We use the following third-party services to operate MedFolio:</p>
            <p className="mt-3">
              <strong>Supabase Inc.</strong> (San Francisco, USA) — provides our database,
              authentication, and file storage. Your data is stored in their London (EU) data
              centre. Supabase maintains Standard Contractual Clauses for GDPR compliance.
            </p>
            <p className="mt-3">
              <strong>Vercel Inc.</strong> (San Francisco, USA) — hosts our website. Vercel
              processes technical request data (IP addresses, page requests) through their
              global edge network. Vercel maintains Standard Contractual Clauses for GDPR
              compliance.
            </p>
            <p className="mt-3">
              We do <strong>not</strong> sell your data to any third party. We do{' '}
              <strong>not</strong> share your data with advertisers. We do <strong>not</strong>{' '}
              use your data for any purpose other than providing and improving the MedFolio
              service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              6. International data transfers
            </h2>
            <p>
              While your data is stored in London (UK), our service providers Supabase and
              Vercel are US-based companies. Their employees may access data for support and
              maintenance purposes. Both companies maintain appropriate safeguards for
              international data transfers, including Standard Contractual Clauses approved
              by the UK Information Commissioner.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              7. How long we keep your data
            </h2>
            <p>
              <strong>Account and portfolio data:</strong> Retained until you delete your
              account. When you delete your account, all associated data (profile, portfolio
              items, cases, uploaded files) is permanently deleted within 24 hours.
            </p>
            <p className="mt-3">
              <strong>Database backups:</strong> Supabase retains automated backups for up to
              7 days. Your data may persist in backups for this period after account deletion.
            </p>
            <p className="mt-3">
              <strong>Server logs:</strong> Technical logs are retained for up to 30 days for
              security monitoring, then automatically deleted.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              8. Your rights under UK GDPR
            </h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li>
                • <strong>Right of access:</strong> You can download all your data at any time
                from Settings → Export Data.
              </li>
              <li>
                • <strong>Right to rectification:</strong> You can edit your profile and all
                your data directly within the app.
              </li>
              <li>
                • <strong>Right to erasure:</strong> You can permanently delete your account
                and all associated data from Settings → Delete Account.
              </li>
              <li>
                • <strong>Right to data portability:</strong> You can export your data in
                JSON and CSV formats from Settings → Export Data.
              </li>
              <li>
                • <strong>Right to withdraw consent:</strong> You can withdraw consent by
                deleting your account. This will permanently remove all your data.
              </li>
              <li>
                • <strong>Right to complain:</strong> If you are unhappy with how we handle
                your data, you have the right to lodge a complaint with the Information
                Commissioner&apos;s Office (ICO) at{' '}
                <a
                  href="https://ico.org.uk/make-a-complaint/"
                  className="text-brand-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ico.org.uk/make-a-complaint
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              9. Cookies
            </h2>
            <p>
              MedFolio uses only <strong>essential cookies</strong> required for the service to
              function. Specifically, we use a session cookie to keep you logged in. This cookie
              is set by Supabase Auth and is necessary for authentication.
            </p>
            <p className="mt-3">
              We do not use any tracking cookies, advertising cookies, or analytics cookies that
              track individual users. No cookie consent banner is required as we only use
              strictly necessary cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              10. Children
            </h2>
            <p>
              MedFolio is intended for use by medical professionals and medical students aged
              18 and over. We do not knowingly collect data from anyone under 18. If you believe
              a person under 18 has created an account, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              11. Changes to this policy
            </h2>
            <p>
              We may update this privacy policy from time to time. If we make material changes,
              we will notify you by email (using the address associated with your account) before
              the changes take effect. The &quot;last updated&quot; date at the top of this page
              indicates when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              12. Contact
            </h2>
            <p>
              If you have any questions about this privacy policy or how we handle your data,
              please contact us at: <strong>[YOUR EMAIL ADDRESS]</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
