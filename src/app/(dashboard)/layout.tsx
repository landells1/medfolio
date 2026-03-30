'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/ui/sidebar';
import { Onboarding } from '@/components/ui/onboarding';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding when primary_specialty is not set.
    // training_stage defaults to 'FY1' via the DB trigger so checking it alone
    // would never trigger; primary_specialty is always blank for new users.
    // The key is user-scoped so one user's dismissal doesn't affect another.
    if (profile && !profile.primary_specialty) {
      try {
        const key = `medfolio_onboarding_dismissed_${profile.id}`;
        const dismissed = localStorage?.getItem(key);
        if (!dismissed) setShowOnboarding(true);
      } catch {}
    }
  }, [profile]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    try {
      const key = `medfolio_onboarding_dismissed_${profile?.id}`;
      localStorage?.setItem(key, 'true');
    } catch {}
  };

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
    </div>
  );
}
