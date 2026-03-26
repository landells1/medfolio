'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatDate, cn } from '@/lib/utils';
import { ArrowLeft, Edit2, Trash2, Copy, Check, Loader2, FileDown, AlertCircle, RefreshCw } from 'lucide-react';
import { exportSingleCasePDF } from '@/lib/export-pdf';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

      setUserId(session.user.id);

      const { data } = await supabase
        .from('cases')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single();
      setCaseData(data);
    } catch (err) {
      console.error('[MedFolio] Case load error:', err);
      setError('Failed to load case. Please try again.');
    }

    setLoading(false);
  }, [supabase, params.id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleDelete = async () => {
    if (!userId) return;
    if (!confirm('Are you sure you want to delete this case? This cannot be undone.')) return;
    setDeleting(true);
    await supabase.from('cases').delete().eq('id', params.id).eq('user_id', userId);
    router.push('/cases/new');
  };

  const handleCopyToClipboard = () => {
    if (!caseData) return;
    const text = [
      `Case: ${caseData.title}`,
      `Date: ${formatDate(caseData.date_seen)}`,
      `Specialty: ${caseData.specialty_tags?.join(', ')}`,
      '',
      caseData.presenting_complaint && `Presenting Complaint:\n${caseData.presenting_complaint}`,
      caseData.key_findings && `Key Findings:\n${caseData.key_findings}`,
      caseData.diagnosis && `Diagnosis: ${caseData.diagnosis}`,
      caseData.management && `Management:\n${caseData.management}`,
      caseData.outcome && `Outcome:\n${caseData.outcome}`,
      caseData.learning_points && `Learning Points:\n${caseData.learning_points}`,
      caseData.reflection && `Reflection:\n${caseData.reflection}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500">Case not found</p>
        <Link href="/cases/new" className="btn-primary mt-4">Back to cases</Link>
      </div>
    );
  }

  const sections = [
    { label: 'Presenting Complaint', value: caseData.presenting_complaint },
    { label: 'Key Findings', value: caseData.key_findings },
    { label: 'Diagnosis', value: caseData.diagnosis },
    { label: 'Management', value: caseData.management },
    { label: 'Outcome', value: caseData.outcome },
    { label: 'Learning Points', value: caseData.learning_points },
    { label: 'Reflection', value: caseData.reflection },
  ].filter((s) => s.value);

  return (
    <div className="page-enter max-w-3xl space-y-6">
      <Link href="/cases/new" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700">
        <ArrowLeft className="w-4 h-4" />
        Back to case journal
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-surface-900 mb-2">{caseData.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-surface-500">{formatDate(caseData.date_seen)}</span>
              {caseData.specialty_tags?.map((tag: string) => (
                <span key={tag} className="badge-brand">{tag}</span>
              ))}
              {caseData.complexity && <span className="badge-slate capitalize">{caseData.complexity}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/cases/${params.id}/edit`} className="btn-ghost text-surface-500" title="Edit case">
              <Edit2 className="w-4 h-4" />
            </Link>
            <button onClick={() => caseData && profile && exportSingleCasePDF(profile.full_name, caseData)} className="btn-ghost text-surface-500" title="Export as PDF">
              <FileDown className="w-4 h-4" />
            </button>
            <button onClick={handleCopyToClipboard} className="btn-ghost text-surface-500">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-ghost text-red-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">{section.label}</h3>
              <p className="text-surface-700 text-sm leading-relaxed whitespace-pre-wrap">{section.value}</p>
            </div>
          ))}
        </div>

        {caseData.custom_tags?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-surface-100">
            <div className="flex flex-wrap gap-1.5">
              {caseData.custom_tags.map((tag: string) => (
                <span key={tag} className="badge-slate">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
