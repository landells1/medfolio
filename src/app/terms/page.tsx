import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-surface-500 mb-10">Last updated: March 2026</p>

        <div className="prose prose-surface max-w-none space-y-8 text-surface-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              1. About MedFolio
            </h2>
            <p>
              MedFolio is an independent, unofficial portfolio companion tool designed to help
              UK junior doctors track their training progress, log clinical cases, and organise
              evidence for professional development.
            </p>
            <p className="mt-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <strong>Important:</strong> MedFolio is NOT affiliated with, endorsed by, or
              connected to NHS England, Health Education England, any Royal College, any Deanery,
              or any NHS Trust. MedFolio is NOT an official ePortfolio system and does NOT replace
              Horus, ISCP, FourteenFish, Kaizen, or any other mandatory training portfolio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              2. Eligibility
            </h2>
            <p>
              To use MedFolio, you must be at least 18 years old. The service is primarily
              designed for UK-based medical professionals and medical students, but is available
              to anyone meeting the age requirement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              3. Your account
            </h2>
            <p>
              You are responsible for maintaining the security of your account, including keeping
              your password confidential. You must provide accurate information when creating your
              account. Each person may only create one account. You must notify us immediately if
              you become aware of any unauthorised use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              4. Acceptable use
            </h2>
            <p>When using MedFolio, you agree to the following:</p>
            <ul className="mt-3 space-y-2 ml-4">
              <li>
                • <strong>No patient-identifiable information:</strong> You must NOT enter any
                information that could identify a patient, including names, dates of birth,
                hospital numbers, NHS numbers, specific dates of admission, or any combination
                of details that could identify an individual. All case entries must be thoroughly
                anonymised in accordance with GMC guidance on reflective practice.
              </li>
              <li>
                • <strong>No clinical images containing identifiable features:</strong> Do not
                upload photographs or images that could identify a patient (faces, tattoos,
                unique identifying features, visible hospital name badges, etc.).
              </li>
              <li>
                • <strong>No sharing of accounts:</strong> Your account is for your personal
                use only. Do not share your login credentials with others.
              </li>
              <li>
                • <strong>No automated access:</strong> Do not use bots, scrapers, or automated
                tools to access the service.
              </li>
              <li>
                • <strong>No illegal or harmful content:</strong> Do not use the service to
                store, transmit, or share any content that is illegal, defamatory, or harmful.
              </li>
              <li>
                • <strong>Professional standards:</strong> You are responsible for ensuring your
                use of MedFolio complies with GMC Good Medical Practice and any applicable
                professional standards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              5. ARCP checklists and training requirements
            </h2>
            <p className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <strong>Critical disclaimer:</strong> The ARCP requirement checklists provided in
              MedFolio are compiled from publicly available Royal College curricula and training
              programme documentation. They are provided for convenience and general guidance
              only. These checklists may be incomplete, outdated, or inaccurate.
            </p>
            <p className="mt-3">
              <strong>You must always verify your ARCP requirements</strong> with your Training
              Programme Director, Educational Supervisor, or Deanery. Requirements vary between
              regions, specialties, and individual circumstances. MedFolio accepts no
              responsibility for any adverse ARCP outcome resulting from reliance on the
              checklists provided.
            </p>
            <p className="mt-3">
              The checklist content is based on publicly available information from Royal College
              websites and curriculum documents. No proprietary or copyrighted content has been
              reproduced.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              6. Not a medical device
            </h2>
            <p>
              MedFolio is a personal organisation and tracking tool. It does NOT provide clinical
              advice, diagnostic tools, drug dosage calculations, treatment recommendations, or
              any other function that could classify it as a medical device under the UK Medical
              Devices Regulations 2002 or the MHRA&apos;s guidance on standalone software.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              7. Intellectual property
            </h2>
            <p>
              <strong>Your content:</strong> You retain full ownership of all content you create
              in MedFolio, including case entries, notes, reflections, and uploaded files. We do
              not claim any intellectual property rights over your content.
            </p>
            <p className="mt-3">
              <strong>Our platform:</strong> The MedFolio platform, including its design, code,
              branding, and user interface, is owned by MedFolio and protected by copyright.
              You may not copy, modify, or distribute the platform itself.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              8. Data and privacy
            </h2>
            <p>
              Your use of MedFolio is also governed by our{' '}
              <Link href="/privacy" className="text-brand-600 hover:underline">
                Privacy Policy
              </Link>
              , which explains how we collect, use, and protect your data. By using MedFolio,
              you agree to the terms of our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              9. Service availability
            </h2>
            <p>
              We aim to keep MedFolio available at all times, but we do not guarantee 100%
              uptime. The service may be temporarily unavailable due to maintenance, updates,
              or circumstances beyond our control. We will endeavour to provide advance notice
              of planned downtime where possible.
            </p>
            <p className="mt-3">
              We may modify, update, or discontinue features of the service at any time. If we
              plan to discontinue the entire service, we will provide at least 30 days&apos;
              notice by email and ensure you can export all your data before closure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              10. Limitation of liability
            </h2>
            <p>
              To the fullest extent permitted by law, MedFolio is provided &quot;as is&quot; and
              &quot;as available&quot; without any warranties, express or implied.
            </p>
            <p className="mt-3">We do not warrant that:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• The service will be uninterrupted or error-free</li>
              <li>• ARCP checklists are complete, accurate, or up to date</li>
              <li>• The service will meet your specific requirements</li>
              <li>• Any data you store will be preserved indefinitely</li>
            </ul>
            <p className="mt-3">
              We shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to loss of data, loss of revenue, or
              adverse training outcomes, arising from your use of the service.
            </p>
            <p className="mt-3">
              Nothing in these terms excludes or limits our liability for death or personal
              injury caused by our negligence, fraud or fraudulent misrepresentation, or any
              other liability that cannot be excluded or limited by English law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              11. Account termination
            </h2>
            <p>
              <strong>By you:</strong> You can delete your account at any time from
              Settings → Delete Account. This permanently removes all your data.
            </p>
            <p className="mt-3">
              <strong>By us:</strong> We may suspend or terminate your account if you violate
              these terms, particularly the acceptable use provisions regarding
              patient-identifiable information. We will notify you by email if we take this
              action and provide the reason.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              12. Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. If we make material changes, we will
              notify you by email at least 14 days before the new terms take effect. Your
              continued use of the service after the new terms take effect constitutes acceptance
              of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              13. Governing law
            </h2>
            <p>
              These terms are governed by the laws of England and Wales. Any disputes arising
              from these terms or your use of MedFolio shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-surface-900 mb-3">
              14. Contact
            </h2>
            <p>
              If you have any questions about these terms, please contact us at:{' '}
              <strong>[YOUR EMAIL ADDRESS]</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
