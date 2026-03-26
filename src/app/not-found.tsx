import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-brand-600">?</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
          Page not found
        </h1>
        <p className="text-surface-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">
            Go to dashboard
          </Link>
          <Link href="/" className="btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
