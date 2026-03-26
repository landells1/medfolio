'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  Stethoscope,
  ClipboardCheck,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from 'lucide-react';

const TRAINING_STAGES = [
  { value: 'FY1', label: 'FY1' },
  { value: 'FY2', label: 'FY2' },
  { value: 'F3', label: 'F3 / Career Break' },
  { value: 'CT1', label: 'CT1' },
  { value: 'CT2', label: 'CT2' },
  { value: 'IMT1', label: 'IMT1' },
  { value: 'IMT2', label: 'IMT2' },
  { value: 'IMT3', label: 'IMT3' },
  { value: 'ST1', label: 'ST1' },
  { value: 'ST2', label: 'ST2' },
  { value: 'ST3', label: 'ST3' },
  { value: 'ST4', label: 'ST4+' },
  { value: 'SAS', label: 'SAS Doctor' },
  { value: 'GP_Trainee', label: 'GP Trainee' },
  { value: 'Consultant', label: 'Consultant' },
  { value: 'Other', label: 'Other / Student' },
];

const SPECIALTIES_OPTIONS = [
  { id: 'foundation', name: 'Foundation (FY1/FY2)', available: true },
  { id: 'imt', name: 'Internal Medicine (IMT)', available: true },
  { id: 'ophthalmology', name: 'Ophthalmology', available: true },
  { id: 'gp', name: 'GP Training', available: false },
  { id: 'cst', name: 'Core Surgical Training', available: false },
  { id: 'anaesthetics', name: 'Anaesthetics', available: false },
  { id: 'em', name: 'Emergency Medicine', available: false },
  { id: 'paediatrics', name: 'Paediatrics', available: false },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [trainingStage, setTrainingStage] = useState(profile?.training_stage || '');
  const [primarySpecialty, setPrimarySpecialty] = useState(profile?.primary_specialty || '');
  const [region, setRegion] = useState(profile?.region || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const totalSteps = 4;

  const handleFinish = async () => {
    if (!profile) return;
    setSaving(true);

    await supabase
      .from('profiles')
      .update({
        training_stage: trainingStage || null,
        primary_specialty: primarySpecialty,
        region,
        secondary_specialties: selectedSpecialties,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    await refreshProfile();
    setSaving(false);
    onComplete();
  };

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Progress bar */}
        <div className="h-1.5 bg-surface-100">
          <div
            className="h-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-surface-900 mb-2">
                Welcome to MedFolio!
              </h2>
              <p className="text-surface-500 mb-8 max-w-sm mx-auto">
                Let&apos;s get you set up in 60 seconds. We&apos;ll personalise your
                experience based on where you are in training.
              </p>
              <button
                onClick={() => setStep(1)}
                className="btn-primary !py-3 !px-8"
              >
                Let&apos;s go
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onComplete}
                className="block mx-auto mt-4 text-sm text-surface-400 hover:text-surface-600"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 1: Training stage */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-surface-900">
                    Where are you in training?
                  </h2>
                  <p className="text-sm text-surface-500">This helps us show relevant content</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {TRAINING_STAGES.map((stage) => (
                  <button
                    key={stage.value}
                    onClick={() => setTrainingStage(stage.value)}
                    className={cn(
                      'px-2 py-2 rounded-lg text-xs font-medium border transition-all text-center',
                      trainingStage === stage.value
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                    )}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Region (optional)
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="input-field"
                  placeholder="e.g. London, South East, Yorkshire"
                />
              </div>
            </div>
          )}

          {/* Step 2: Specialties */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-surface-900">
                    Which specialties do you want to track?
                  </h2>
                  <p className="text-sm text-surface-500">Select all that apply</p>
                </div>
              </div>

              <div className="space-y-2">
                {SPECIALTIES_OPTIONS.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => spec.available && toggleSpecialty(spec.id)}
                    disabled={!spec.available}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                      !spec.available
                        ? 'opacity-50 cursor-not-allowed border-surface-100 bg-surface-50'
                        : selectedSpecialties.includes(spec.id)
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-surface-200 hover:bg-surface-50'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selectedSpecialties.includes(spec.id)
                          ? 'text-brand-700'
                          : 'text-surface-700'
                      )}
                    >
                      {spec.name}
                    </span>
                    {!spec.available ? (
                      <span className="badge-slate text-[10px]">Coming soon</span>
                    ) : selectedSpecialties.includes(spec.id) ? (
                      <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-surface-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: All done */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-surface-900 mb-2">
                You&apos;re all set!
              </h2>
              <p className="text-surface-500 mb-8 max-w-sm mx-auto">
                Your portfolio is ready. Start by tracking your requirements or logging an
                interesting case.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <button
                  onClick={handleFinish}
                  className="card-hover p-4 text-center group"
                >
                  <ClipboardCheck className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-surface-800">
                    Track portfolio
                  </p>
                </button>
                <button
                  onClick={handleFinish}
                  className="card-hover p-4 text-center group"
                >
                  <BookOpen className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-surface-800">Log a case</p>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step > 0 && step < 3 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep((s) => s - 1)}
                className="btn-ghost text-surface-500"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep((s) => s + 1)}
                className="btn-primary"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
