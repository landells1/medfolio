'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn, formatDate } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import {
  X,
  Check,
  Clock,
  Circle,
  Save,
  Copy,
  Loader2,
} from 'lucide-react';
import type { PortfolioItemRow, PortfolioItemUpdate, UploadRow } from '@/lib/database.types';

interface ItemDetailPanelProps {
  item: PortfolioItemRow | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (item: PortfolioItemRow) => void;
}

export function ItemDetailPanel({
  item,
  isOpen,
  onClose,
  onUpdate,
}: ItemDetailPanelProps) {
  const supabase = createClient();

  const [notes, setNotes] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [dateCompleted, setDateCompleted] = useState('');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>(
    'not_started'
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploads, setUploads] = useState<UploadRow[]>([]);

  useEffect(() => {
    if (item) {
      const metadata: Record<string, unknown> =
        typeof item.metadata === 'object' && item.metadata && !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : {};

      setNotes(item.notes || '');
      setSupervisorName(
        typeof metadata.supervisor_name === 'string' ? metadata.supervisor_name : ''
      );
      setDateCompleted(item.date_completed || '');
      setStatus(item.status);
    }
  }, [item]);

  useEffect(() => {
    if (item) {
      void fetchUploads();
    }
  }, [item]);

  const fetchUploads = async () => {
    if (!item) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('portfolio_item_id', item.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MedFolio] Upload fetch error:', error);
      return;
    }

    setUploads(data || []);
  };

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);

    const updates: PortfolioItemUpdate = {
      notes,
      status,
      date_completed: dateCompleted || null,
      metadata: {
        ...(typeof item.metadata === 'object' && item.metadata ? item.metadata : {}),
        supervisor_name: supervisorName,
      },
    };

    const { error } = await supabase
      .from('portfolio_items')
      .update(updates)
      .eq('id', item.id);

    if (!error) {
      onUpdate({ ...item, ...updates });
    }

    setSaving(false);
  };

  const handleCopyToClipboard = () => {
    if (!item) return;
    const text = [
      `${item.title}`,
      `Status: ${item.status === 'completed' ? 'Completed' : item.status === 'in_progress' ? 'In Progress' : 'Not Started'}`,
      `Progress: ${item.current_count}/${item.target_count}`,
      dateCompleted && `Date Completed: ${formatDate(dateCompleted)}`,
      supervisorName && `Supervisor: ${supervisorName}`,
      notes && `\nNotes:\n${notes}`,
      uploads.length > 0 && `\nEvidence files: ${uploads.length} attached`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !item) return null;

  const statusOptions = [
    {
      value: 'not_started' as const,
      label: 'Not started',
      icon: Circle,
      class: 'text-surface-400 border-surface-200',
      activeClass: 'bg-surface-100 border-surface-300 text-surface-700',
    },
    {
      value: 'in_progress' as const,
      label: 'In progress',
      icon: Clock,
      class: 'text-amber-400 border-surface-200',
      activeClass: 'bg-amber-50 border-amber-300 text-amber-700',
    },
    {
      value: 'completed' as const,
      label: 'Completed',
      icon: Check,
      class: 'text-emerald-400 border-surface-200',
      activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-surface-900 truncate">
              {item.title}
            </h2>
            <p className="text-sm text-surface-500">
              {item.category} · {item.specialty}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyToClipboard}
              className="btn-ghost text-surface-400"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button onClick={onClose} className="btn-ghost text-surface-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          {item.description && (
            <div>
              <p className="text-sm text-surface-500">{item.description}</p>
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50">
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-surface-900">
                {item.current_count}
              </p>
              <p className="text-xs text-surface-500">Done</p>
            </div>
            <div className="text-surface-300">/</div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-surface-400">
                {item.target_count}
              </p>
              <p className="text-xs text-surface-500">Target</p>
            </div>
            <div className="flex-1">
              <div className="h-2.5 rounded-full bg-surface-200 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    item.current_count >= item.target_count
                      ? 'bg-emerald-500'
                      : 'bg-brand-500'
                  )}
                  style={{
                    width: `${Math.min(
                      (item.current_count / item.target_count) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                    status === opt.value ? opt.activeClass : opt.class
                  )}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date completed */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Date completed
            </label>
            <input
              type="date"
              value={dateCompleted}
              onChange={(e) => setDateCompleted(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Supervisor */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Supervisor name
            </label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="input-field"
              placeholder="e.g. Dr Smith, Consultant Physician"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="Add any notes, feedback received, or details about this item..."
            />
          </div>

          {/* Evidence uploads */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Evidence files
            </label>
            <FileUpload
              portfolioItemId={item.id}
              existingFiles={uploads}
              onFilesChange={setUploads}
              compact
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>
    </>
  );
}
