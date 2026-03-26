'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { ArrowLeft, Save, Loader2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

const SPECIALTY_OPTIONS = [
  'General Medicine', 'General Surgery', 'Cardiology', 'Respiratory',
  'Gastroenterology', 'Neurology', 'Endocrinology', 'Rheumatology',
  'Nephrology', 'Haematology', 'Oncology', 'Ophthalmology',
  'ENT', 'Dermatology', 'Psychiatry', 'Paediatrics',
  'Obstetrics & Gynaecology', 'Emergency Medicine', 'Anaesthetics',
  'Orthopaedics', 'Urology', 'Vascular Surgery', 'Radiology',
  'Infectious Disease', 'Geriatrics', 'Palliative Care', 'Other',
];

export default function CaseEditPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date_seen: '',
    specialty_tags: [] as string[],
    presenting_complaint: '',
    key_findings: '',
    diagnosis: '',
    management: '',
    outcome: '',
    learning_points: '',
    reflection: '',
    complexity: 'routine' as string,
    custom_tags: '',
  });

  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not signed in. Please log in and try again.');
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('cases')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setForm({
          title: data.title || '',
          date_seen: data.date_seen || '',
          specialty_tags: data.specialty_tags || [],
          presenting_complaint: data.presenting_complaint || '',
          key_findings: data.key_findings || '',
          diagnosis: data.diagnosis || '',
          management: data.management || '',
          outcome: data.outcome || '',
          learning_points: data.learning_points || '',
          reflection: data.reflection || '',
          complexity: data.complexity || 'routine',
          custom_tags: (data.custom_tags || []).join(', '),
        });
      }
    } catch (err) {
      console.error('[MedFolio] Case edit load error:', err);
      setError('Failed to load case. Please try again.');
    }

    setLoading(false);
  }, [supabase, params.id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const toggleSpecialtyTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      specialty_tags: prev.specialty_tags.includes(tag)
        ? prev.specialty_tags.filter((t) => t !== tag)
        : [...prev.specialty_tags, tag],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('cases')
      .update({
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
        custom_tags: form.custom_tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      .eq('id', params.id);

    setSaving(false);
    if (!error) {
      router.push(`/cases/${params.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <p className="text-sm text-surface-500">Loading case...</p>
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
        <button onClick={fetchCase} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-3xl space-y-6">
      <Link href={`/cases/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700">
        <ArrowLeft className="w-4 h-4" />
        Back to case
      </Link>

      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-xl font-bold text-surface-900 mb-6">Edit case</h1>

        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 mb-1">Anonymisation reminder</h4>
              <p className="text-sm text-amber-700">Ensure all patient details remain anonymised following GMC guidance.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Case title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Date seen *</label>
              <input type="date" value={form.date_seen} onChange={(e) => setForm((p) => ({ ...p, date_seen: e.target.value }))} className="input-field" required />
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Complexity</label>
            <div className="flex gap-2">
              {['routine', 'moderate', 'complex', 'rare'].map((level) => (
                <button key={level} type="button" onClick={() => setForm((p) => ({ ...p, complexity: level }))} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border capitalize', form.complexity === level ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-500 hover:bg-surface-50')}>
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Presenting complaint</label>
              <textarea value={form.presenting_complaint} onChange={(e) => setForm((p) => ({ ...p, presenting_complaint: e.target.value }))} className="input-field min-h-[80px] resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Key findings</label>
              <textarea value={form.key_findings} onChange={(e) => setForm((p) => ({ ...p, key_findings: e.target.value }))} className="input-field min-h-[80px] resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Diagnosis</label>
              <input type="text" value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Management</label>
              <textarea value={form.management} onChange={(e) => setForm((p) => ({ ...p, management: e.target.value }))} className="input-field min-h-[80px] resize-y" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Outcome</label>
            <textarea value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))} className="input-field min-h-[60px] resize-y" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Learning points *</label>
            <textarea value={form.learning_points} onChange={(e) => setForm((p) => ({ ...p, learning_points: e.target.value }))} className="input-field min-h-[100px] resize-y" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Reflection</label>
            <textarea value={form.reflection} onChange={(e) => setForm((p) => ({ ...p, reflection: e.target.value }))} className="input-field min-h-[80px] resize-y" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Custom tags (comma-separated)</label>
            <input type="text" value={form.custom_tags} onChange={(e) => setForm((p) => ({ ...p, custom_tags: e.target.value }))} className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Evidence files</label>
            <FileUpload caseId={params.id as string} compact />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Link href={`/cases/${params.id}`} className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
