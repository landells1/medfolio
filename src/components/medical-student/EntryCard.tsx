'use client';

import { useState } from 'react';
import { Pencil, Trash2, Loader2, Calendar, GraduationCap } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { TEMPLATES } from '@/lib/medical-student-types';
import type { MedStudentEntry, MedStudentCategory } from '@/lib/medical-student-types';

// Fields worth previewing on the card (prefer these keys if present)
const PREVIEW_KEYS = [
  'background', 'description', 'summary', 'results', 'topic',
  'module_or_course', 'awarding_body', 'specialty', 'journal_or_conference',
  'publication_type', 'authors',
];

function getPreviewText(entry: MedStudentEntry): string | null {
  for (const key of PREVIEW_KEYS) {
    const val = entry.data[key];
    if (val && val.trim()) return val.trim();
  }
  // Fall back to first non-empty data field
  for (const val of Object.values(entry.data)) {
    if (val && val.trim()) return val.trim();
  }
  return null;
}

function getTemplateLabel(category: MedStudentCategory, templateType: string): string {
  const templates = TEMPLATES[category];
  return templates.find((t) => t.id === templateType)?.label ?? templateType;
}

type Props = {
  entry: MedStudentEntry;
  onEdit: (entry: MedStudentEntry) => void;
  onDelete: (id: string) => Promise<void>;
};

export function EntryCard({ entry, onEdit, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preview = getPreviewText(entry);
  const templateLabel = getTemplateLabel(entry.category, entry.template_type);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(entry.id);
    setDeleting(false);
    setConfirmDelete(false);
  }

  return (
    <div className="card p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-surface-900 truncate">{entry.title}</h3>
          <div className="flex items-center flex-wrap gap-2 mt-1.5">
            <span className="badge-brand text-[11px]">{templateLabel}</span>
            {entry.year_of_training && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">
                <GraduationCap className="w-3 h-3" />
                Year {entry.year_of_training}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded text-surface-500 hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center gap-1"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-md text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview text */}
      {preview && (
        <p className="text-sm text-surface-600 line-clamp-2">{preview}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-surface-400 mt-auto pt-1">
        <Calendar className="w-3 h-3" />
        {formatDate(entry.created_at)}
      </div>
    </div>
  );
}
