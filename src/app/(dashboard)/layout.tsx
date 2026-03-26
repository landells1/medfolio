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
    if (profile && !profile.training_stage && !profile.primary_specialty) {
      try {
        const dismissed = localStorage?.getItem('medfolio_onboarding_dismissed');
        if (!dismissed) setShowOnboarding(true);
      } catch {}
    }
  }, [profile]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    try {
      localStorage?.setItem('medfolio_onboarding_dismissed', 'true');
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
