'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { getApplicationSpecialtyById, getApplicationSpecialtyDbName, cn } from '@/lib/utils';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { ItemDetailPanel } from '@/components/portfolio/item-detail-panel';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { PortfolioItemInsert, PortfolioItemRow, PortfolioItemUpdate } from '@/lib/database.types';

type PortfolioItem = PortfolioItemRow;

type Template = {
  id: string;
  checklist_set_id: string | null;
  specialty: string;
  training_year: string;
  category: string;
  item_name: string;
  description: string;
  target_count: number;
  is_mandatory: boolean;
  sort_order: number;
};

export default function ApplicationSpecialtyPage() {
  const params = useParams();
  const specialtyId = params.specialty as string;
  const appSpecialty = getApplicationSpecialtyById(specialtyId);
  const dbName = getApplicationSpecialtyDbName(specialtyId);

  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialising, setInitialising] = useState(false);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());

  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const cats = new Set(templates.map((t) => t.category));
    setExpandedCategories(cats);
  }, [templates]);

  const loadData = useCallback(async (uid: string, cancelled: { current: boolean }) => {
    setLoading(true);
    setError(null);
    setInitialising(false);
    let baseDataLoaded = false;

    try {
      if (cancelled.current) return;
      setUserId(uid);

      // Find the checklist_set for this application specialty
      const { data: setData, error: setError } = await supabase
        .from('checklist_sets')
        .select('id')
        .eq('kind', 'application')
        .eq('specialty', dbName)
        .single();

      if (setError || !setData) {
        throw new Error('Application checklist not found');
      }

      const checklistSetId = (setData as { id: string }).id;

      // Fetch templates and existing items in parallel
      const [templatesRes, itemsRes] = await Promise.all([
        supabase
          .from('checklist_templates')
          .select('*')
          .eq('checklist_set_id', checklistSetId)
          .order('sort_order'),
        supabase
          .from('portfolio_items')
          .select('*')
          .eq('user_id', uid)
          .eq('specialty', dbName),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      if (cancelled.current) return;

      const fetchedTemplates: Template[] = templatesRes.data ?? [];
      const existingItems: PortfolioItem[] = itemsRes.data ?? [];

      setTemplates(fetchedTemplates);
      setItems(existingItems);
      setLoading(false);
      baseDataLoaded = true;

      // Auto-initialize missing portfolio_items
      const existingTemplateIds = new Set(existingItems.map((i) => i.template_id));
      const missing = fetchedTemplates.filter((t) => !existingTemplateIds.has(t.id));

      let combinedItems = existingItems;

      if (missing.length > 0) {
        setInitialising(true);
        const newItems: PortfolioItemInsert[] = missing.map((t) => ({
          user_id: uid,
          template_id: t.id,
          specialty: dbName,
          category: t.category,
          subcategory: '',
          title: t.item_name,
          description: t.description,
          status: 'not_started' as const,
          current_count: 0,
          target_count: t.target_count,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('portfolio_items')
          .upsert(newItems as never, { onConflict: 'user_id,template_id' })
          .select();

        if (insertError) throw insertError;

        if (cancelled.current) return;
        combinedItems = Array.from(
          new Map(
            [...existingItems, ...((inserted ?? []) as PortfolioItemRow[])].map((portfolioItem) => [
              portfolioItem.template_id ?? portfolioItem.id,
              portfolioItem,
            ])
          ).values()
        ) as PortfolioItem[];

        setItems(combinedItems);
      }
    } catch (err: unknown) {
      console.error('[MedFolio] Application load error:', err);
      if (!cancelled.current) {
        if (!baseDataLoaded) {
          setError('Failed to load application checklist. Please try again.');
        } else {
          toast('Checklist initialisation is taking longer than expected. Refresh in a moment if items are missing.', 'info');
        }
      }
    } finally {
      if (!cancelled.current) {
        setLoading(false);
        setInitialising(false);
      }
    }
  }, [dbName, supabase, toast]);

  // ⚠️ INFINITE LOADING BUG WARNING — do not change this pattern.
  const authUserId = user?.id;

  useEffect(() => {
    if (!dbName || authLoading || !authUserId) return;

    const cancelled = { current: false };
    loadData(authUserId, cancelled);

    return () => { cancelled.current = true; };
  }, [dbName, authLoading, authUserId, loadData]);

  const getItemForTemplate = (templateId: string) => {
    return items.find((i) => i.template_id === templateId);
  };

  const handleItemClick = (item: PortfolioItem) => {
    setSelectedItem(item);
    setPanelOpen(true);
  };

  const handlePanelUpdate = (updated: PortfolioItem) => {
    setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
    setSelectedItem(updated);
  };

  const toggleComplete = async (item: PortfolioItem) => {
    const isCurrentlyComplete = item.status === 'completed';
    const newStatus = isCurrentlyComplete ? 'not_started' as const : 'completed' as const;
    const newCount = isCurrentlyComplete ? 0 : item.target_count;
    const newDate = isCurrentlyComplete ? null : new Date().toISOString().split('T')[0];
    const originalItem = { ...item };

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: newStatus, current_count: newCount, date_completed: newDate }
          : i
      )
    );

    setSavingItems((prev) => new Set(prev).add(item.id));

    const updates: PortfolioItemUpdate = {
      status: newStatus,
      current_count: newCount,
      date_completed: newDate,
    };

    const { error } = await supabase
      .from('portfolio_items')
      .update(updates as never)
      .eq('id', item.id)
      .eq('user_id', userId ?? '');

    if (error) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? originalItem : i)));
      toast('Failed to save item status. Please try again.', 'error');
    }

    setSavingItems((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  };

  const markCategoryComplete = async (category: string) => {
    const categoryItems = items.filter(
      (i) =>
        templates.find((t) => t.id === i.template_id)?.category === category &&
        i.status !== 'completed'
    );

    if (categoryItems.length === 0) return;

    const ids = categoryItems.map((i) => i.id);

    setItems((prev) =>
      prev.map((i) =>
        ids.includes(i.id)
          ? {
              ...i,
              status: 'completed' as const,
              current_count: i.target_count,
              date_completed: new Date().toISOString().split('T')[0],
            }
          : i
      )
    );

    const results = await Promise.all(
      categoryItems.map((item) => {
        const updates: PortfolioItemUpdate = {
          status: 'completed',
          current_count: item.target_count,
          date_completed: new Date().toISOString().split('T')[0],
        };

        return supabase
          .from('portfolio_items')
          .update(updates as never)
          .eq('id', item.id)
          .eq('user_id', userId ?? '');
      })
    );

    if (results.some((result) => result.error)) {
      setItems((prev) =>
        prev.map((i) => (ids.includes(i.id) ? categoryItems.find((item) => item.id === i.id) || i : i))
      );
      toast('Failed to mark every item complete. Please try again.', 'error');
      return;
    }

    toast(`${categoryItems.length} items marked complete`);
  };

  const resetCategory = async (category: string) => {
    if (!confirm(`Reset all items in "${category}" to not started?`)) return;

    const categoryItems = items.filter(
      (i) => templates.find((t) => t.id === i.template_id)?.category === category
    );

    const ids = categoryItems.map((i) => i.id);

    setItems((prev) =>
      prev.map((i) =>
        ids.includes(i.id)
          ? { ...i, status: 'not_started' as const, current_count: 0, date_completed: null }
          : i
      )
    );

    const resetUpdate: PortfolioItemUpdate = {
      status: 'not_started',
      current_count: 0,
      date_completed: null,
    };

    const { error: resetError } = await supabase
      .from('portfolio_items')
      .update(resetUpdate as never)
      .in('id', ids)
      .eq('user_id', userId ?? '');

    if (resetError) {
      setItems((prev) =>
        prev.map((i) => (ids.includes(i.id) ? categoryItems.find((item) => item.id === i.id) || i : i))
      );
      toast(`Failed to reset ${category}. Please try again.`, 'error');
      return;
    }

    toast(`${category} reset to not started`, 'info');
  };

  const handleRetry = () => {
    if (!authUserId) return;
    const cancelled = { current: false };
    loadData(authUserId, cancelled);
  };

  const categories = useMemo(() => {
    return templates.reduce<Record<string, Template[]>>((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {});
  }, [templates]);

  const totalItems = templates.length;
  const completedItems = templates.filter((t) => {
    const item = getItemForTemplate(t.id);
    return item?.status === 'completed';
  }).length;
  const overallPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const readinessLabel = overallPercentage >= 80 ? 'Strong' : overallPercentage >= 50 ? 'Building' : 'Getting started';

  if (!appSpecialty) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500">Application specialty not found</p>
        <Link href="/applications" className="text-brand-600 hover:text-brand-700 text-sm mt-2 inline-block">
          Back to applications
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div>
        <Link href="/applications" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          All applications
        </Link>
        <h1 className="font-display text-2xl font-bold text-surface-900">
          {appSpecialty.displayName}
        </h1>
        <p className="text-surface-500 mt-1">
          Track your readiness for {appSpecialty.displayName} applications
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <p className="text-sm text-surface-500">Loading checklist...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-surface-600 text-center max-w-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      ) : (
        <>
          {initialising && (
            <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Initialising checklist items...
            </div>
          )}

          {/* Overall readiness card */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressRing
                value={overallPercentage}
                size={110}
                strokeWidth={8}
                label={`${Math.round(overallPercentage)}%`}
                sublabel="ready"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                  <h3 className="font-display font-semibold text-surface-900">
                    Application Readiness
                  </h3>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    overallPercentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                    overallPercentage >= 50 ? 'bg-amber-100 text-amber-700' :
                    'bg-surface-100 text-surface-600'
                  )}>
                    {readinessLabel}
                  </span>
                </div>
                <p className="text-sm text-surface-500">
                  {completedItems === totalItems && totalItems > 0
                    ? 'All items complete — you\'re ready to apply!'
                    : `${completedItems}/${totalItems} items complete. ${totalItems - completedItems} remaining.`}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-surface-400 px-1">
            This checklist is for guidance only. Always verify application requirements with the relevant deanery or specialty school.
          </p>

          {/* Checklist by category */}
          <div className="space-y-4">
            {Object.entries(categories).map(([category, categoryTemplates]) => {
              const isExpanded = expandedCategories.has(category);
              const catCompleted = categoryTemplates.filter((t) => {
                const item = getItemForTemplate(t.id);
                return item?.status === 'completed';
              }).length;
              const allComplete = catCompleted === categoryTemplates.length;

              return (
                <div key={category} className="card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4">
                    <button
                      onClick={() => {
                        setExpandedCategories((prev) => {
                          const next = new Set(prev);
                          if (next.has(category)) next.delete(category);
                          else next.add(category);
                          return next;
                        });
                      }}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-surface-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-surface-400" />
                      )}
                      <h3 className="font-display font-semibold text-surface-800">
                        {category}
                      </h3>
                      <span
                        className={cn(
                          'badge',
                          allComplete ? 'bg-emerald-100 text-emerald-700' : 'badge-slate'
                        )}
                      >
                        {allComplete && <Check className="w-3 h-3 mr-1" />}
                        {catCompleted}/{categoryTemplates.length}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={catCompleted}
                        max={categoryTemplates.length}
                        className="w-24 hidden sm:flex"
                        showLabel={false}
                        size="sm"
                      />
                      {!allComplete ? (
                        <button
                          onClick={() => markCategoryComplete(category)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap hidden sm:block"
                        >
                          Complete all
                        </button>
                      ) : (
                        <button
                          onClick={() => resetCategory(category)}
                          className="text-xs text-surface-400 hover:text-surface-600 font-medium whitespace-nowrap hidden sm:block"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-surface-100">
                      {categoryTemplates.map((template) => {
                        const item = getItemForTemplate(template.id);
                        if (!item) return null;

                        const isSaving = savingItems.has(item.id);
                        const isComplete = item.status === 'completed';

                        return (
                          <div
                            key={template.id}
                            className={cn(
                              'flex items-center gap-3 sm:gap-4 px-5 py-3 border-b border-surface-50 last:border-0 transition-colors',
                              isComplete ? 'bg-emerald-50/30' : 'hover:bg-surface-50/50'
                            )}
                          >
                            <button
                              onClick={() => toggleComplete(item)}
                              disabled={isSaving}
                              className="flex-shrink-0 transition-transform active:scale-90"
                            >
                              {isComplete ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-surface-300 hover:text-surface-400" />
                              )}
                            </button>

                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleItemClick(item)}
                            >
                              <p
                                className={cn(
                                  'text-sm font-medium hover:text-brand-600 transition-colors',
                                  isComplete
                                    ? 'text-surface-400 line-through'
                                    : 'text-surface-800'
                                )}
                              >
                                {template.item_name}
                              </p>
                              {template.description && !isComplete && (
                                <p className="text-xs text-surface-400 mt-0.5 truncate">
                                  {template.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="sm:hidden px-5 py-2 bg-surface-50/50 flex justify-end gap-3">
                        {!allComplete ? (
                          <button
                            onClick={() => markCategoryComplete(category)}
                            className="text-xs text-brand-600 font-medium flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Complete all
                          </button>
                        ) : (
                          <button
                            onClick={() => resetCategory(category)}
                            className="text-xs text-surface-400 font-medium"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <ItemDetailPanel
        item={selectedItem}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUpdate={handlePanelUpdate}
      />
    </div>
  );
}
