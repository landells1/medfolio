'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { formatDate, cn } from '@/lib/utils';
import type { CaseInsert, CaseRow } from '@/lib/database.types';
import {
  Plus,
  Search,
  BookOpen,
  AlertTriangle,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

type CaseListItem = Pick<
  CaseRow,
  'id' | 'title' | 'diagnosis' | 'learning_points' | 'complexity' | 'specialty_tags' | 'date_seen' | 'presenting_complaint'
>;
const PAGE_SIZE = 20;

const SPECIALTY_OPTIONS = [
  'General Medicine', 'General Surgery', 'Cardiology', 'Respiratory',
  'Gastroenterology', 'Neurology', 'Endocrinology', 'Rheumatology',
  'Nephrology', 'Haematology', 'Oncology', 'Ophthalmology',
  'ENT', 'Dermatology', 'Psychiatry', 'Paediatrics',
  'Obstetrics & Gynaecology', 'Emergency Medicine', 'Anaesthetics',
  'Orthopaedics', 'Urology', 'Vascular Surgery', 'Radiology',
  'Infectious Disease', 'Geriatrics', 'Palliative Care', 'Other',
];

const COMPLEXITY_LABELS = {
  routine: { label: 'Routine', class: 'badge-slate' },
  moderate: { label: 'Moderate', class: 'badge-brand' },
  complex: { label: 'Complex', class: 'badge-amber' },
  rare: { label: 'Rare', class: 'bg-purple-100 text-purple-700' },
};

export default function CaseJournalPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    date_seen: new Date().toISOString().split('T')[0],
    specialty_tags: [] as string[],
    presenting_complaint: '',
    key_findings: '',
    diagnosis: '',
    management: '',
    outcome: '',
    learning_points: '',
    reflection: '',
    complexity: 'routine' as 'routine' | 'moderate' | 'complex' | 'rare',
    custom_tags: '',
  });


  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not signed in. Please log in and try again.');
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('cases')
        .select('id, title, diagnosis, learning_points, complexity, specialty_tags, date_seen, presenting_complaint')
        .eq('user_id', session.user.id)
        .order('date_seen', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;
      setCases(data || []);
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (err) {
      console.error('[MedFolio] Cases load error:', err);
      setError('Failed to load cases. Please try again.');
    }

    setLoading(false);
  }, [supabase]);

  const loadMore = async () => {
    if (loadingMore || !userId) return;
    setLoadingMore(true);

    const { data, error } = await supabase
      .from('cases')
      .select('id, title, diagnosis, learning_points, complexity, specialty_tags, date_seen, presenting_complaint')
      .eq('user_id', userId)
      .order('date_seen', { ascending: false })
      .range(cases.length, cases.length + PAGE_SIZE - 1);

    if (error) {
      setLoadingMore(false);
      toast('Failed to load more cases. Please try again.', 'error');
      return;
    }
    const newCases = data || [];
    setCases((prev) => [...prev, ...newCases]);
    setHasMore(newCases.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('cases')
      .insert({
        user_id: userId,
        title: form.title,
        date_seen: form.date_seen,
        specialty_tags: form.specialty_tags,
        presenting_complaint: form.presenting_complaint,
        key_findings: form.key_findings,
        diagnosis: form.diagnosis,
        management: form.management,
        outcome: form.outcome,
        learning_points: form.learning_points,
        reflection: form.reflection,
        complexity: form.complexity,
        custom_tags: form.custom_tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        is_anonymised_confirmed: true,
      } satisfies CaseInsert)
      .select()
      .single();

    if (error) {
      toast(error.message, 'error');
      setSaving(false);
      return;
    }

    if (data) {
      setCases((prev) => [data, ...prev]);
      setShowForm(false);
      resetForm();
      toast('Case saved successfully');
    }
    setSaving(false);
  };

  const resetForm = () => {
    setForm({
      title: '',
      date_seen: new Date().toISOString().split('T')[0],
      specialty_tags: [],
      presenting_complaint: '',
      key_findings: '',
      diagnosis: '',
      management: '',
      outcome: '',
      learning_points: '',
      reflection: '',
      complexity: 'routine',
      custom_tags: '',
    });
  };

  const toggleSpecialtyTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      specialty_tags: prev.specialty_tags.includes(tag)
        ? prev.specialty_tags.filter((t) => t !== tag)
        : [...prev.specialty_tags, tag],
    }));
  };

  const filtered = useMemo(() => cases.filter((c) => {
    const matchesSearch =
      !debouncedSearch ||
      c.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.diagnosis?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.presenting_complaint?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesSpecialty =
      !filterSpecialty || c.specialty_tags?.includes(filterSpecialty);
    return matchesSearch && matchesSpecialty;
  }), [cases, debouncedSearch, filterSpecialty]);

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Case Journal</h1>
          <p className="text-surface-500 mt-1">
            Log interesting cases and build your clinical experience library
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New case'}
        </button>
      </div>

      {/* New case form */}
      {showForm && (
        <div className="card p-6 animate-scale-in">
          <h2 className="font-display font-semibold text-surface-900 mb-4">Log a new case</h2>

          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800 mb-1">Anonymisation reminder</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>&bull; Use age ranges (e.g. &quot;60s&quot;) not exact ages</li>
                  <li>&bull; Do not include specific dates of admission</li>
                  <li>&bull; Do not name hospitals or wards</li>
                  <li>&bull; Use gender-neutral language where possible</li>
                  <li>&bull; Flag rare conditions — these may identify patients</li>
                  <li>&bull; Focus on learning points, not full case details</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Case title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input-field" placeholder="e.g. Acute presentation of Addisonian crisis" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Date seen *</label>
                <input type="date" value={form.date_seen} onChange={(e) => setForm((p) => ({ ...p, date_seen: e.target.value }))} className="input-field" required />
              </div>
            </div>

            {/* Specialty tags */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Specialty tags</label>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTY_OPTIONS.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggleSpecialtyTag(tag)} className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-all', form.specialty_tags.includes(tag) ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200')}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Complexity</label>
              <div className="flex gap-2">
                {(['routine', 'moderate', 'complex', 'rare'] as const).map((level) => (
                  <button key={level} type="button" onClick={() => setForm((p) => ({ ...p, complexity: level }))} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border capitalize', form.complexity === level ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-500 hover:bg-surface-50')}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Presenting complaint</label>
                <textarea value={form.presenting_complaint} onChange={(e) => setForm((p) => ({ ...p, presenting_complaint: e.target.value }))} className="input-field min-h-[80px] resize-y" placeholder="Brief anonymised summary..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Key findings</label>
                <textarea value={form.key_findings} onChange={(e) => setForm((p) => ({ ...p, key_findings: e.target.value }))} className="input-field min-h-[80px] resize-y" placeholder="Examination / investigation findings..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Diagnosis</label>
                <input type="text" value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} className="input-field" placeholder="Final or working diagnosis" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Management</label>
                <textarea value={form.management} onChange={(e) => setForm((p) => ({ ...p, management: e.target.value }))} className="input-field min-h-[80px] resize-y" placeholder="Treatment / management plan..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Outcome</label>
              <textarea value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))} className="input-field min-h-[60px] resize-y" placeholder="Patient outcome (anonymised)..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Learning points *</label>
              <textarea value={form.learning_points} onChange={(e) => setForm((p) => ({ ...p, learning_points: e.target.value }))} className="input-field min-h-[100px] resize-y" placeholder="What did you learn? How will this change your practice?" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Reflection (optional)</label>
              <textarea value={form.reflection} onChange={(e) => setForm((p) => ({ ...p, reflection: e.target.value }))} className="input-field min-h-[80px] resize-y" placeholder="Personal reflection on this case..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Custom tags (comma-separated)</label>
              <input type="text" value={form.custom_tags} onChange={(e) => setForm((p) => ({ ...p, custom_tags: e.target.value }))} className="input-field" placeholder="e.g. acute, exam-relevant, MDT discussion" />
            </div>


            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                Save case
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-10" placeholder="Search cases by title, diagnosis, or complaint..." />
        </div>
        <select value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)} className="input-field w-full sm:w-48">
          <option value="">All specialties</option>
          {SPECIALTY_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Cases list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <p className="text-sm text-surface-500">Loading cases...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-surface-600 text-center max-w-sm">{error}</p>
          <button onClick={fetchCases} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <BookOpen className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-surface-700 mb-2">
            {cases.length === 0 ? 'No cases yet' : 'No matching cases'}
          </h3>
          <p className="text-surface-500 text-sm mb-6">
            {cases.length === 0 ? 'Start building your clinical experience library by logging your first case.' : 'Try adjusting your search or filters.'}
          </p>
          {cases.length === 0 && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Log your first case
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`} className="card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-surface-800 text-sm line-clamp-2">{c.title}</h3>
                <span className={cn('badge flex-shrink-0', COMPLEXITY_LABELS[c.complexity as keyof typeof COMPLEXITY_LABELS]?.class || 'badge-slate')}>
                  {COMPLEXITY_LABELS[c.complexity as keyof typeof COMPLEXITY_LABELS]?.label || c.complexity}
                </span>
              </div>
              {c.diagnosis && <p className="text-xs text-surface-500 line-clamp-1"><span className="font-medium">Dx:</span> {c.diagnosis}</p>}
              {c.learning_points && <p className="text-xs text-surface-400 line-clamp-2">{c.learning_points}</p>}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-surface-100">
                {c.specialty_tags?.slice(0, 2).map((tag: string) => (
                  <span key={tag} className="badge-brand text-[10px]">{tag}</span>
                ))}
                <span className="text-xs text-surface-400 ml-auto">{formatDate(c.date_seen)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button onClick={loadMore} disabled={loadingMore} className="btn-secondary">
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more cases
          </button>
        </div>
      )}

    </div>
  );
}
