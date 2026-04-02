'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { APPLICATION_SPECIALTIES, cn } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import {
  Target,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Check,
} from 'lucide-react';
import type { ChecklistSetRow, UserChecklistSetRow, PortfolioItemRow } from '@/lib/database.types';

type AppSetWithProgress = {
  set: ChecklistSetRow;
  isActivated: boolean;
  userSetId: string | null;
  completed: number;
  total: number;
};

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [appSets, setAppSets] = useState<AppSetWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  const fetchData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all application checklist sets
      const { data: sets, error: setsError } = await supabase
        .from('checklist_sets')
        .select('*')
        .eq('kind', 'application')
        .order('sort_order');

      if (setsError) throw setsError;

      const allSets = (sets ?? []) as ChecklistSetRow[];

      // Fetch user's activations
      const { data: userSets, error: userSetsError } = await supabase
        .from('user_checklist_sets')
        .select('*')
        .eq('user_id', userId);

      if (userSetsError) throw userSetsError;

      const activatedMap = new Map<string, UserChecklistSetRow>();
      for (const us of (userSets ?? []) as UserChecklistSetRow[]) {
        if (us.is_active) activatedMap.set(us.checklist_set_id, us);
      }

      // For activated sets, fetch progress
      const activatedSetIds = Array.from(activatedMap.keys());
      let progressMap: Record<string, { completed: number; total: number }> = {};

      if (activatedSetIds.length > 0) {
        // Get templates for these sets
        const { data: templates } = await supabase
          .from('checklist_templates')
          .select('id, checklist_set_id')
          .in('checklist_set_id', activatedSetIds);

        const templatesBySet: Record<string, string[]> = {};
        for (const t of (templates ?? []) as Array<{ id: string; checklist_set_id: string | null }>) {
          if (t.checklist_set_id) {
            if (!templatesBySet[t.checklist_set_id]) templatesBySet[t.checklist_set_id] = [];
            templatesBySet[t.checklist_set_id].push(t.id);
          }
        }

        // Get user's portfolio items for these templates
        const allTemplateIds = Object.values(templatesBySet).flat();
        if (allTemplateIds.length > 0) {
          const { data: items } = await supabase
            .from('portfolio_items')
            .select('template_id, status')
            .eq('user_id', userId)
            .in('template_id', allTemplateIds);

          const portfolioItems = (items ?? []) as Pick<PortfolioItemRow, 'template_id' | 'status'>[];

          for (const [setId, tIds] of Object.entries(templatesBySet)) {
            const setItems = portfolioItems.filter((i) => i.template_id && tIds.includes(i.template_id));
            progressMap[setId] = {
              total: tIds.length,
              completed: setItems.filter((i) => i.status === 'completed').length,
            };
          }
        }
      }

      // Build combined view
      const combined: AppSetWithProgress[] = allSets.map((set) => {
        const userSet = activatedMap.get(set.id);
        const progress = progressMap[set.id] || { completed: 0, total: 0 };
        return {
          set,
          isActivated: !!userSet,
          userSetId: userSet?.id ?? null,
          completed: progress.completed,
          total: progress.total,
        };
      });

      setAppSets(combined);
    } catch (err) {
      console.error('[MedFolio] Applications load error:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const userId = user?.id;
  useEffect(() => {
    if (authLoading || !userId) return;
    fetchData(userId);
  }, [authLoading, userId, fetchData]);

  const handleActivate = async (setId: string) => {
    if (!userId) return;
    setActivating(setId);

    const { error } = await supabase
      .from('user_checklist_sets')
      .insert({ user_id: userId, checklist_set_id: setId } as never);

    if (error) {
      toast('Failed to activate application tracking. Please try again.', 'error');
      setActivating(null);
      return;
    }

    toast('Application tracking activated!');
    await fetchData(userId);
    setActivating(null);
  };

  const handleDeactivate = async (userSetId: string) => {
    if (!userId) return;
    setActivating(userSetId);

    const { error } = await supabase
      .from('user_checklist_sets')
      .delete()
      .eq('id', userSetId)
      .eq('user_id', userId);

    if (error) {
      toast('Failed to deactivate. Please try again.', 'error');
      setActivating(null);
      return;
    }

    toast('Application tracking deactivated', 'info');
    await fetchData(userId);
    setActivating(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <p className="text-sm text-surface-500">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-surface-600 text-center max-w-sm">{error}</p>
        <button onClick={() => userId && fetchData(userId)} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  const getAppSlug = (dbSpecialty: string) => {
    const found = APPLICATION_SPECIALTIES.find((s) => s.name === dbSpecialty);
    return found?.id || dbSpecialty.toLowerCase();
  };

  const activatedSets = appSets.filter((a) => a.isActivated);
  const availableSets = appSets.filter((a) => !a.isActivated);

  return (
    <div className="page-enter space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Future Applications</h1>
        <p className="text-surface-500 mt-1">
          Track your readiness for specialty applications separately from your current training.
        </p>
      </div>

      {/* Activated application sets */}
      {activatedSets.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-surface-800">Your Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activatedSets.map((app) => {
              const percentage = app.total > 0 ? Math.round((app.completed / app.total) * 100) : 0;
              const readinessLabel = percentage >= 80 ? 'Strong' : percentage >= 50 ? 'Building' : 'Getting started';

              return (
                <Link
                  key={app.set.id}
                  href={`/applications/${getAppSlug(app.set.specialty)}`}
                  className="card-hover p-6 group"
                >
                  <div className="flex items-start gap-5">
                    <ProgressRing
                      value={percentage}
                      size={80}
                      strokeWidth={6}
                      label={`${percentage}%`}
                      sublabel="ready"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">
                        {app.set.name}
                      </h3>
                      <p className="text-sm text-surface-500 mt-1">
                        {app.completed}/{app.total} items complete
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-surface-100 text-surface-600'
                        )}>
                          {readinessLabel}
                        </span>
                        <span className="text-xs text-brand-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Open <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Available application sets */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-surface-800">
          {activatedSets.length > 0 ? 'More Applications' : 'Available Applications'}
        </h2>

        {availableSets.length === 0 && activatedSets.length > 0 ? (
          <div className="card p-8 text-center">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-surface-500 text-sm">You&apos;ve activated all available application checklists.</p>
            <p className="text-surface-400 text-xs mt-1">More specialties will be added soon.</p>
          </div>
        ) : availableSets.length === 0 ? (
          <div className="card p-8 text-center">
            <Target className="w-10 h-10 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No application checklists available yet.</p>
            <p className="text-surface-400 text-xs mt-1">Check back soon — more specialties are coming.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSets.map((app) => (
              <div key={app.set.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-surface-900">{app.set.name}</h3>
                    {app.set.description && (
                      <p className="text-sm text-surface-500 mt-1 line-clamp-2">{app.set.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleActivate(app.set.id)}
                    disabled={activating === app.set.id}
                    className="btn-primary text-sm flex-shrink-0"
                  >
                    {activating === app.set.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Start tracking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
