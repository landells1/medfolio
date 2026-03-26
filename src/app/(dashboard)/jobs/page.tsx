'use client';

import { Briefcase, Bell } from 'lucide-react';

export default function JobsPage() {
  return (
    <div className="page-enter">
      <div className="text-center py-20 card max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="font-display text-xl font-bold text-surface-900 mb-2">
          Job Alerts — Coming Soon
        </h1>
        <p className="text-surface-500 text-sm mb-6 max-w-sm mx-auto">
          Aggregated medical job alerts from NHS Jobs, Reed, and Adzuna with
          personalised filtering by specialty, grade, and location.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-50 border border-surface-200 text-surface-600 text-sm">
          <Bell className="w-4 h-4" />
          Phase 2 feature — in development
        </div>
      </div>
    </div>
  );
}
