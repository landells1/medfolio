'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FileUpload } from '@/components/ui/file-upload';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function EvidencePage() {
  const params = useParams();
  const specialtyId = params.specialty as string;
  const itemId = params.itemId as string;
  const supabase = createClient();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItem = useCallback(async () => {
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
        .from('portfolio_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', session.user.id)
        .single();
      if (data) {
        setItem(data);
        setNotes(data.notes || '');
      }
    } catch (err) {
      console.error('[MedFolio] Evidence load error:', err);
      setError('Failed to load item. Please try again.');
    }

    setLoading(false);
  }, [supabase, itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSaveNotes = async () => {
    if (!item) return;
    setSaving(true);
    await supabase
      .from('portfolio_items')
      .update({ notes })
      .eq('id', item.id);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <p className="text-sm text-surface-500">Loading evidence...</p>
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
        <button onClick={fetchItem} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500">Item not found</p>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl space-y-6">
      <Link href={`/portfolio/${specialtyId}`} className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700">
        <ArrowLeft className="w-4 h-4" />
        Back to {specialtyId}
      </Link>

      <div>
        <h1 className="font-display text-xl font-bold text-surface-900">{item.title}</h1>
        <p className="text-surface-500 text-sm mt-1">{item.category} · {item.specialty}</p>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-700">Progress: {item.current_count} / {item.target_count}</p>
          <p className="text-xs text-surface-400 capitalize">Status: {item.status.replace('_', ' ')}</p>
        </div>
        <div className="h-2 w-32 rounded-full bg-surface-100 overflow-hidden">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min((item.current_count / item.target_count) * 100, 100)}%` }} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-surface-900 mb-3">Notes</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field min-h-[120px] resize-y mb-3" placeholder="Add notes — supervisor name, feedback received, details about this requirement..." />
        <button onClick={handleSaveNotes} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save notes
        </button>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-surface-900 mb-3">Evidence files</h2>
        <p className="text-sm text-surface-500 mb-4">Upload certificates, WBA forms, feedback screenshots, audit reports, or any other supporting evidence.</p>
        <FileUpload portfolioItemId={itemId} />
      </div>
    </div>
  );
}
