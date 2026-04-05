'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  FlaskConical,
  GraduationCap,
  Trophy,
  Star,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { EntryCard } from '@/components/medical-student/EntryCard';
import { EntryForm } from '@/components/medical-student/EntryForm';
import { CATEGORIES } from '@/lib/medical-student-types';
import type { MedStudentCategory, MedStudentEntry } from '@/lib/medical-student-types';

// Icon map for each category
const CATEGORY_ICONS: Record<MedStudentCategory, React.ElementType> = {
  qip_audit: TrendingUp,
  research_publication: FlaskConical,
  teaching: GraduationCap,
  prize_award: Trophy,
  commitment_specialty: Star,
};

// ─── Search-param reader (must be inside Suspense) ───────────────────────────

function TabFromParams({ onTab }: { onTab: (tab: MedStudentCategory) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get('tab') as MedStudentCategory | null;
    if (tab && CATEGORIES.find((c) => c.id === tab)) {
      onTab(tab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MedicalStudentPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<MedStudentCategory>('qip_audit');
  const [entries, setEntries] = useState<MedStudentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MedStudentEntry | null>(null);

  const fetchEntries = useCallback(
    async (userId: string, category: MedStudentCategory) => {
      setLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from('medical_student_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (dbError) {
        setError('Failed to load entries. Please try again.');
      } else {
        setEntries((data ?? []) as MedStudentEntry[]);
      }
      setLoading(false);
    },
    [supabase]
  );

  const userId = user?.id;
  useEffect(() => {
    if (authLoading || !userId) return;
    void fetchEntries(userId, activeTab);
  }, [authLoading, userId, activeTab, fetchEntries]);

  async function handleDelete(id: string) {
    await supabase.from('medical_student_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleEdit(entry: MedStudentEntry) {
    setEditingEntry(entry);
    setShowForm(true);
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditingEntry(null);
    if (userId) void fetchEntries(userId, activeTab);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingEntry(null);
  }

  const activeCat = CATEGORIES.find((c) => c.id === activeTab)!;

  return (
    <div className="page-enter space-y-6">
      {/* Read tab from URL params without blocking render */}
      <Suspense fallback={null}>
        <TabFromParams onTab={setActiveTab} />
      </Suspense>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">
            Medical Student Portfolio
          </h1>
          <p className="text-surface-500 mt-1">
            Track your achievements and activities throughout medical school.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add entry
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap border-b border-surface-100 pb-0">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id];
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
                isActive
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-surface-500 hover:text-surface-800 hover:border-surface-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {/* Tab description + count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-surface-500">{activeCat.description}</p>
          {!loading && !error && (
            <span className="text-xs font-medium text-surface-400">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            <p className="text-sm text-surface-500">Loading entries...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-surface-600">{error}</p>
            <button
              onClick={() => userId && fetchEntries(userId, activeTab)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-surface-300" />
            </div>
            <div className="text-center">
              <p className="font-medium text-surface-700">No entries yet</p>
              <p className="text-sm text-surface-500 mt-1">
                Start building your {activeCat.label.toLowerCase()} portfolio.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add your first entry
            </button>
          </div>
        )}

        {/* Entry grid */}
        {!loading && !error && entries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <EntryForm
          category={activeTab}
          entry={editingEntry}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
