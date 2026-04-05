'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { TEMPLATES, CATEGORIES, YEAR_OPTIONS } from '@/lib/medical-student-types';
import type {
  MedStudentCategory,
  MedStudentEntry,
  Template,
} from '@/lib/medical-student-types';

type Props = {
  category: MedStudentCategory;
  entry?: MedStudentEntry | null;
  onClose: () => void;
  onSaved: () => void;
};

function emptyFields(template: Template): Record<string, string> {
  return Object.fromEntries(template.fields.map((f) => [f.key, '']));
}

export function EntryForm({ category, entry, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const supabase = createClient();

  const templates = TEMPLATES[category];
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  const [templateId, setTemplateId] = useState<string>(entry?.template_type ?? templates[0].id);
  const [title, setTitle] = useState(entry?.title ?? '');
  const [year, setYear] = useState<number | ''>(entry?.year_of_training ?? '');
  const [fields, setFields] = useState<Record<string, string>>(entry?.data ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When template changes, preserve existing values but add missing keys
  const activeTemplate = templates.find((t) => t.id === templateId) ?? templates[0];

  const handleTemplateChange = useCallback(
    (newId: string) => {
      setTemplateId(newId);
      const newTemplate = templates.find((t) => t.id === newId) ?? templates[0];
      setFields((prev) => {
        const base = emptyFields(newTemplate);
        // Carry forward any values whose keys exist in the new template
        for (const key of Object.keys(base)) {
          if (prev[key] !== undefined) base[key] = prev[key];
        }
        return base;
      });
    },
    [templates]
  );

  // Initialise fields when editing a saved entry
  useEffect(() => {
    if (entry) {
      setTemplateId(entry.template_type);
      setTitle(entry.title);
      setYear(entry.year_of_training ?? '');
      setFields(entry.data ?? {});
    } else {
      setFields(emptyFields(templates[0]));
    }
  }, [entry, templates]);

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      user_id: user.id,
      category,
      template_type: templateId,
      year_of_training: year === '' ? null : year,
      title: title.trim(),
      data: fields,
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = entry
      ? await supabase
          .from('medical_student_entries')
          .update(payload)
          .eq('id', entry.id)
      : await supabase.from('medical_student_entries').insert(payload);

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    onSaved();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <div>
              <h2 className="font-display font-semibold text-surface-900">
                {entry ? 'Edit entry' : 'Add entry'}
              </h2>
              <p className="text-xs text-surface-500 mt-0.5">{categoryLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form
            id="ms-entry-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          >
            {/* Template selector */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Template
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateChange(t.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      templateId === t.id
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-surface-600 border-surface-200 hover:border-brand-400 hover:text-brand-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5" htmlFor="ms-title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="ms-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
            </div>

            {/* Year of training */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5" htmlFor="ms-year">
                Year of Training
              </label>
              <select
                id="ms-year"
                value={year}
                onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
              >
                <option value="">Not specified</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic template fields */}
            {activeTemplate.fields.map((field) => (
              <div key={field.key}>
                <label
                  className="block text-sm font-medium text-surface-700 mb-1.5"
                  htmlFor={`ms-field-${field.key}`}
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    id={`ms-field-${field.key}`}
                    value={fields[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    required={field.required}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`ms-field-${field.key}`}
                    value={fields[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    required={field.required}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'date' ? (
                  <input
                    id={`ms-field-${field.key}`}
                    type="date"
                    value={fields[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    required={field.required}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    id={`ms-field-${field.key}`}
                    type="text"
                    value={fields[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              form="ms-entry-form"
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {entry ? 'Save changes' : 'Add entry'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
