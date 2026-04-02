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
    // Show onboarding for users who have not set their primary specialty.
    // primary_specialty defaults to '' in the DB so this correctly catches
    // brand-new users. The key is scoped per user so dismissing on one
    // account doesn't suppress it for another account on the same device.
    // Once the user completes onboarding their primary_specialty is saved,
    // so the condition becomes false and the modal never shows again —
    // even if localStorage is cleared.
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
      if (profile?.id) {
        localStorage?.setItem(`medfolio_onboarding_dismissed_${profile.id}`, 'true');
      }
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
