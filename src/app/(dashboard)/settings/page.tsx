'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { User, Download, Trash2, Loader2, Check, Shield, FileText } from 'lucide-react';
import type { ProfileUpdate, TrainingStage } from '@/lib/database.types';

const TRAINING_STAGES: Array<{ value: TrainingStage; label: string }> = [
  { value: 'Medical Student', label: 'Medical Student' },
  { value: 'FY1', label: 'FY1' },
  { value: 'FY2', label: 'FY2' },
  { value: 'F3', label: 'F3' },
  { value: 'CT1', label: 'CT1' },
  { value: 'CT2', label: 'CT2' },
  { value: 'IMT1', label: 'IMT1' },
  { value: 'IMT2', label: 'IMT2' },
  { value: 'IMT3', label: 'IMT3' },
  { value: 'ST1', label: 'ST1' },
  { value: 'ST2', label: 'ST2' },
  { value: 'ST3', label: 'ST3' },
  { value: 'ST4', label: 'ST4' },
  { value: 'ST5', label: 'ST5' },
  { value: 'ST6', label: 'ST6' },
  { value: 'ST7', label: 'ST7' },
  { value: 'ST8', label: 'ST8' },
  { value: 'SAS', label: 'SAS' },
  { value: 'Consultant', label: 'Consultant' },
  { value: 'GP_Trainee', label: 'GP Trainee' },
  { value: 'Other', label: 'Other' },
];

const UK_REGIONS = [
  'East of England',
  'London',
  'Midlands',
  'North East and Yorkshire',
  'North West',
  'South East',
  'South West',
  'Wales',
  'Scotland',
  'Northern Ireland',
];

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [trainingStage, setTrainingStage] = useState<TrainingStage | ''>('');
  const [primarySpecialty, setPrimarySpecialty] = useState('');
  const [region, setRegion] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTrainingStage(profile.training_stage || '');
      setPrimarySpecialty(profile.primary_specialty || '');
      setRegion(profile.region || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast('Not signed in. Please log in and try again.', 'error');
      return;
    }

    setSaving(true);

    const updates: ProfileUpdate = {
      full_name: fullName.trim(),
      training_stage: trainingStage || null,
      primary_specialty: primarySpecialty.trim(),
      region,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);

    if (error) {
      setSaving(false);
      toast(error.message, 'error');
      return;
    }

    await refreshProfile();
    setSaving(false);
    setSaved(true);
    toast('Profile saved successfully');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setExporting(true);

    const userId = session.user.id;

    const [casesRes, itemsRes, uploadsRes, remindersRes] = await Promise.all([
      supabase.from('cases').select('*').eq('user_id', userId),
      supabase.from('portfolio_items').select('*').eq('user_id', userId),
      supabase.from('uploads').select('*').eq('user_id', userId),
      supabase.from('reminders').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: {
        full_name: fullName,
        email: session.user.email || profile?.email || '',
        training_stage: trainingStage,
        primary_specialty: primarySpecialty,
        region,
      },
      cases: casesRes.data || [],
      portfolio_items: itemsRes.data || [],
      uploads_metadata: uploadsRes.data || [],
      reminders: remindersRes.data || [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medfolio-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
  };

  const handleExportCSV = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setExporting(true);

    const { data: cases } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date_seen', { ascending: false });

    if (cases && cases.length > 0) {
      const headers = [
        'Title', 'Date Seen', 'Specialties', 'Presenting Complaint',
        'Key Findings', 'Diagnosis', 'Management', 'Outcome',
        'Learning Points', 'Reflection', 'Complexity', 'Tags',
      ];
      const rows = cases.map((c) => [
        c.title, c.date_seen, (c.specialty_tags || []).join('; '),
        c.presenting_complaint, c.key_findings, c.diagnosis, c.management,
        c.outcome, c.learning_points, c.reflection, c.complexity,
        (c.custom_tags || []).join('; '),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medfolio-cases-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setExporting(false);
  };

  const handleExportPortfolioCSV = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setExporting(true);

    const { data: items } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', session.user.id)
      .order('specialty')
      .order('category');

    if (items && items.length > 0) {
      const headers = [
        'Specialty', 'Category', 'Item', 'Status', 'Progress',
        'Target', 'Date Completed', 'Supervisor', 'Notes',
      ];

      const rows = items.map((i) => {
        const metadata: Record<string, unknown> =
          typeof i.metadata === 'object' && i.metadata && !Array.isArray(i.metadata)
            ? (i.metadata as Record<string, unknown>)
            : {};

        return [
          i.specialty,
          i.category,
          i.title,
          i.status.replace('_', ' '),
          String(i.current_count),
          String(i.target_count),
          i.date_completed || '',
          typeof metadata.supervisor_name === 'string' ? metadata.supervisor_name : '',
          i.notes || '',
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medfolio-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast('No portfolio data to export yet', 'info');
    }

    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setDeleting(false); return; }

    const { error } = await supabase.functions.invoke('delete-user', {
      method: 'POST',
    });

    if (error) {
      toast('Failed to delete account. Please try again.', 'error');
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="page-enter max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your profile, data, and account</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-5 h-5 text-surface-500" />
          <h2 className="font-display font-semibold text-surface-900">Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Training stage</label>
              <select
                value={trainingStage}
                onChange={(e) => setTrainingStage(e.target.value as TrainingStage | '')}
                className="input-field"
              >
                <option value="">Select...</option>
                {TRAINING_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Primary specialty</label>
              <input type="text" value={primarySpecialty} onChange={(e) => setPrimarySpecialty(e.target.value)} className="input-field" placeholder="e.g. Internal Medicine" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="input-field">
              <option value="">Select your region...</option>
              {UK_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saved ? 'Saved' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Data export */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Download className="w-5 h-5 text-surface-500" />
          <h2 className="font-display font-semibold text-surface-900">Export your data</h2>
        </div>
        <p className="text-sm text-surface-500 mb-4">
          Download all your data in various formats.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportData} disabled={exporting} className="btn-secondary">
            <FileText className="w-4 h-4" />
            Everything (JSON)
          </button>
          <button onClick={handleExportCSV} disabled={exporting} className="btn-secondary">
            <FileText className="w-4 h-4" />
            Cases (CSV)
          </button>
          <button onClick={handleExportPortfolioCSV} disabled={exporting} className="btn-secondary">
            <FileText className="w-4 h-4" />
            Portfolio progress (CSV)
          </button>
        </div>
      </div>

      {/* Privacy info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-5 h-5 text-surface-500" />
          <h2 className="font-display font-semibold text-surface-900">Privacy & security</h2>
        </div>
        <div className="text-sm text-surface-600 space-y-2">
          <p>Your data is stored securely on UK servers (London region) with AES-256 encryption at rest and TLS 1.3 in transit.</p>
          <p>MedFolio does not store patient-identifiable data. All case entries must be anonymised before saving.</p>
          <p>We do not share your data with third parties. See our privacy policy for full details.</p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-200">
        <div className="flex items-center gap-3 mb-5">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-display font-semibold text-red-700">Delete account</h2>
        </div>
        <p className="text-sm text-surface-600 mb-4">
          This will permanently delete your account and all associated data including cases,
          portfolio items, and uploaded files. This action cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="input-field sm:w-48" placeholder='Type "DELETE" to confirm' />
          <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE' || deleting} className="btn-primary !bg-red-600 hover:!bg-red-700 disabled:!bg-red-300">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Delete my account
          </button>
        </div>
      </div>
    </div>
  );
}
