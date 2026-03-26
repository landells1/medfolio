'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getSpecialtyById, getSpecialtyDbName, cn } from '@/lib/utils';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { ItemDetailPanel } from '@/components/portfolio/item-detail-panel';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Paperclip,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

type PortfolioItem = {
  id: string;
  template_id: string;
  specialty: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  current_count: number;
  target_count: number;
  notes: string;
  date_completed: string | null;
  evidence_urls: string[];
  metadata: any;
};

type Template = {
  id: string;
  specialty: string;
  training_year: string;
  category: string;
  item_name: string;
  description: string;
  target_count: number;
  is_mandatory: boolean;
  sort_order: number;
};

type UploadCount = Record<string, number>;

export default function PortfolioSpecialtyPage() {
  const params = useParams();
  const specialtyId = params.specialty as string;
  const specialty = getSpecialtyById(specialtyId);
  const dbName = getSpecialtyDbName(specialtyId);

  const supabase = createClient();

  // ALL templates and items for this specialty (every year)
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [allItems, setAllItems] = useState<PortfolioItem[]>([]);
  const [uploadCounts, setUploadCounts] = useState<UploadCount>({});

  const [selectedYear, setSelectedYear] = useState(specialty?.years[0] || '');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const { toast } = useToast();

  // Detail panel state
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // --- DERIVED STATE: filter by selected year, no Supabase calls ---
  const templates = useMemo(
    () => allTemplates.filter((t) => t.training_year === selectedYear),
    [allTemplates, selectedYear]
  );

  const items = useMemo(
    () => {
      const yearTemplateIds = new Set(templates.map((t) => t.id));
      return allItems.filter((i) => yearTemplateIds.has(i.template_id));
    },
    [allItems, templates]
  );

  // Expand all categories when year changes
  useEffect(() => {
    const cats = new Set(templates.map((t) => t.category));
    setExpandedCategories(cats);
  }, [templates]);

  // --- SINGLE FETCH: loads everything for this specialty once ---
  const loadData = useCallback(async (cancelled: { current: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user || cancelled.current) {
        if (!session?.user) setError('Not signed in. Please log in and try again.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Fetch ALL templates and ALL user items for this specialty (every year)
      const [templatesRes, itemsRes] = await Promise.all([
        supabase
          .from('checklist_templates')
          .select('*')
          .eq('specialty', dbName)
          .order('sort_order'),
        supabase
          .from('portfolio_items')
          .select('*')
          .eq('user_id', userId)
          .eq('specialty', dbName),
      ]);

      if (cancelled.current) return;

      const fetchedTemplates = templatesRes.data || [];
      const existingItems = itemsRes.data || [];

      // Auto-initialise missing items for ALL years at once
      const existingTemplateIds = new Set(existingItems.map((i) => i.template_id));
      const missing = fetchedTemplates.filter((t) => !existingTemplateIds.has(t.id));

      let combinedItems = existingItems;

      if (missing.length > 0) {
        const newItems = missing.map((t) => ({
          user_id: userId,
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

        const { data: inserted } = await supabase
          .from('portfolio_items')
          .insert(newItems)
          .select();

        if (cancelled.current) return;
        combinedItems = [...existingItems, ...(inserted || [])];
      }

      // Fetch upload counts for all items
      const itemIds = combinedItems.map((i) => i.id);
      let counts: Record<string, number> = {};
      if (itemIds.length > 0) {
        const { data: uploads } = await supabase
          .from('uploads')
          .select('portfolio_item_id')
          .eq('user_id', userId)
          .in('portfolio_item_id', itemIds);

        (uploads || []).forEach((u) => {
          if (u.portfolio_item_id) {
            counts[u.portfolio_item_id] = (counts[u.portfolio_item_id] || 0) + 1;
          }
        });
      }

      if (cancelled.current) return;

      setAllTemplates(fetchedTemplates);
      setAllItems(combinedItems);
      setUploadCounts(counts);
    } catch (err: any) {
      console.error('[MedFolio] Portfolio load error:', err);
      if (!cancelled.current) {
        setError('Failed to load portfolio. Please try again.');
      }
    }

    if (!cancelled.current) setLoading(false);
  }, [dbName, supabase]);

  // Only runs once per specialty (dbName), NOT on year change
  useEffect(() => {
    if (!dbName) return;

    const cancelled = { current: false };
    loadData(cancelled);

    return () => { cancelled.current = true; };
  }, [dbName, loadData]);

  const getItemForTemplate = (templateId: string) => {
    return items.find((i) => i.template_id === templateId);
  };

  // Update local state helper — updates allItems so filtered views stay in sync
  const updateItems = (updater: (prev: PortfolioItem[]) => PortfolioItem[]) => {
    setAllItems(updater);
  };

  const handleItemClick = (item: PortfolioItem) => {
    setSelectedItem(item);
    setPanelOpen(true);
  };

  const handlePanelUpdate = (updated: PortfolioItem) => {
    setAllItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
    // Keep selectedItem in sync so panel reflects latest state
    setSelectedItem(updated);
  };

  const toggleComplete = async (item: PortfolioItem) => {
    const isCurrentlyComplete = item.status === 'completed';
    const newStatus = isCurrentlyComplete ? 'not_started' as const : 'completed' as const;
    const newCount = isCurrentlyComplete ? 0 : item.target_count;
    const newDate = isCurrentlyComplete ? null : new Date().toISOString().split('T')[0];

    updateItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: newStatus, current_count: newCount, date_completed: newDate }
          : i
      )
    );

    setSavingItems((prev) => new Set(prev).add(item.id));

    await supabase
      .from('portfolio_items')
      .update({
        status: newStatus,
        current_count: newCount,
        date_completed: newDate,
      })
      .eq('id', item.id);

    setSavingItems((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  };

  const updateCount = (item: PortfolioItem, newCount: number) => {
    const clamped = Math.max(0, Math.min(newCount, 999));
    const newStatus =
      clamped >= item.target_count ? 'completed' as const
      : clamped > 0 ? 'in_progress' as const
      : 'not_started' as const;

    // Immediate UI update
    updateItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, current_count: clamped, status: newStatus }
          : i
      )
    );

    // Debounced DB write — waits 500ms after last keystroke
    if (debounceTimers.current[item.id]) {
      clearTimeout(debounceTimers.current[item.id]);
    }
    debounceTimers.current[item.id] = setTimeout(async () => {
      await supabase
        .from('portfolio_items')
        .update({
          current_count: clamped,
          status: newStatus,
          date_completed: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', item.id);
      delete debounceTimers.current[item.id];
    }, 500);
  };

  const markCategoryComplete = async (category: string) => {
    const categoryItems = items.filter(
      (i) =>
        templates.find((t) => t.id === i.template_id)?.category === category &&
        i.status !== 'completed'
    );

    if (categoryItems.length === 0) return;

    const ids = categoryItems.map((i) => i.id);

    updateItems((prev) =>
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

    await Promise.all(
      categoryItems.map((item) =>
        supabase
          .from('portfolio_items')
          .update({
            status: 'completed',
            current_count: item.target_count,
            date_completed: new Date().toISOString().split('T')[0],
          })
          .eq('id', item.id)
      )
    );

    toast(`${categoryItems.length} items marked complete`);
  };

  const resetCategory = async (category: string) => {
    if (!confirm(`Reset all items in "${category}" to not started?`)) return;

    const categoryItems = items.filter(
      (i) => templates.find((t) => t.id === i.template_id)?.category === category
    );

    const ids = categoryItems.map((i) => i.id);

    updateItems((prev) =>
      prev.map((i) =>
        ids.includes(i.id)
          ? { ...i, status: 'not_started' as const, current_count: 0, date_completed: null }
          : i
      )
    );

    await Promise.all(
      categoryItems.map((item) =>
        supabase
          .from('portfolio_items')
          .update({ status: 'not_started', current_count: 0, date_completed: null })
          .eq('id', item.id)
      )
    );

    toast(`${category} reset to not started`, 'info');
  };

  const handleRetry = () => {
    const cancelled = { current: false };
    loadData(cancelled);
  };

  // Group templates by category
  const categories = templates.reduce<Record<string, Template[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const totalItems = templates.length;
  const completedItems = templates.filter((t) => {
    const item = getItemForTemplate(t.id);
    return item?.status === 'completed';
  }).length;
  const overallPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (!specialty) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500">Specialty not found</p>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">
            {specialty.name}
          </h1>
          <p className="text-surface-500 mt-1">
            Track your ARCP requirements and evidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {specialty.years.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                selectedYear === year
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <p className="text-sm text-surface-500">Loading requirements...</p>
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
          {/* Overall progress card */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressRing
                value={overallPercentage}
                size={110}
                strokeWidth={8}
                label="Overall"
                sublabel={`${completedItems}/${totalItems} items`}
              />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display font-semibold text-surface-900 mb-1">
                  {selectedYear} Progress
                </h3>
                <p className="text-sm text-surface-500">
                  {completedItems === totalItems && totalItems > 0
                    ? 'All requirements met \u2014 well done!'
                    : `${totalItems - completedItems} items remaining. Click checkboxes to mark complete, or click an item name for details.`}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-surface-400 px-1">
            Checklist items are for guidance only. Always verify requirements with your TPD or Deanery.
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
                  {/* Category header */}
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

                  {/* Items */}
                  {isExpanded && (
                    <div className="border-t border-surface-100">
                      {categoryTemplates.map((template) => {
                        const item = getItemForTemplate(template.id);
                        if (!item) return null;

                        const isSaving = savingItems.has(item.id);
                        const isComplete = item.status === 'completed';
                        const hasCount = template.target_count > 1;
                        const fileCount = uploadCounts[item.id] || 0;

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

                            {/* Clickable item name opens detail panel */}
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleItemClick(item)}
                            >
                              <div className="flex items-center gap-2">
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
                                {template.is_mandatory && !isComplete && (
                                  <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
                                    Req
                                  </span>
                                )}
                              </div>
                              {template.description && !isComplete && (
                                <p className="text-xs text-surface-400 mt-0.5 truncate">
                                  {template.description}
                                </p>
                              )}
                            </div>

                            <Link
                              href={`/portfolio/${specialtyId}/evidence/${item.id}`}
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0',
                                fileCount > 0
                                  ? 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                                  : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600'
                              )}
                              title="Upload evidence"
                            >
                              <Paperclip className="w-3 h-3" />
                              {fileCount > 0 && <span>{fileCount}</span>}
                            </Link>

                            {hasCount && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={999}
                                  value={item.current_count}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    updateCount(item, val);
                                  }}
                                  className={cn(
                                    'w-12 h-8 text-center rounded-md border text-sm font-mono tabular-nums',
                                    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
                                    isComplete
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-white border-surface-200 text-surface-700'
                                  )}
                                />
                                <span className="text-xs text-surface-400 font-mono">
                                  / {template.target_count}
                                </span>
                              </div>
                            )}
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
