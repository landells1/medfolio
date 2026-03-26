'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { SPECIALTIES } from '@/lib/utils';
import {
  Stethoscope,
  Eye,
  Heart,
  Activity,
  Syringe,
  Baby,
  Brain,
  Pill,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const SPECIALTY_DETAILS: Record<
  string,
  {
    icon: any;
    color: string;
    bgColor: string;
    description: string;
    years: string;
    keyRequirements: string[];
    status: 'available' | 'coming_soon';
  }
> = {
  foundation: {
    icon: Stethoscope,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description:
      'The universal foundation programme for all UK medical graduates. Track WBAs, supervisor reports, and mandatory requirements across FY1 and FY2.',
    years: 'FY1 – FY2 (2 years)',
    keyRequirements: [
      'Mini-CEX, CBD, DOPS assessments',
      'TAB / Multi-Source Feedback',
      'Clinical & Educational Supervisor reports',
      'PSA (Prescribing Safety Assessment)',
      'Reflections and personal development',
    ],
    status: 'available',
  },
  imt: {
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description:
      'Internal Medicine Training — the common stem for all physician specialties. Track WBAs, MRCP progress, procedures, and QI projects across IMT1–IMT3.',
    years: 'IMT1 – IMT3 (3 years)',
    keyRequirements: [
      'Mini-CEX, CBD, ACAT, DOPS assessments',
      'Multiple Consultant Reports',
      'MRCP Part 1, Part 2 Written, PACES',
      'Core procedures (LP, ascitic tap, chest drain)',
      'Quality Improvement Project with QIPAT',
    ],
    status: 'available',
  },
  ophthalmology: {
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description:
      'Ophthalmology specialty training with numbered scoring matrices. Track surgical logbook, WBAs, clinical experience, and FRCOphth exam progress.',
    years: 'ST1 – ST7 (7 years)',
    keyRequirements: [
      'WBAs including OSATS for surgical skills',
      'Surgical logbook (cataract, minor ops)',
      'Outpatient and emergency clinic sessions',
      'FRCOphth examinations',
      'Research and audit activity',
    ],
    status: 'available',
  },
};

const COMING_SOON = [
  {
    name: 'GP Training',
    icon: Pill,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'GPST1–ST3 with FourteenFish integration guidance. Clinical Case Reviews, COTs, CBDs.',
  },
  {
    name: 'Core Surgical Training',
    icon: Syringe,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'CST1–CT2 with operative logbook tracking, MRCS exam progress, and WBA targets.',
  },
  {
    name: 'Anaesthetics',
    icon: Activity,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'CT1–ST7 anaesthetics training with IAC assessments, logbook, and primary FRCA tracking.',
  },
  {
    name: 'Emergency Medicine',
    icon: Activity,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'ST1–ST6 EM training with competency levels, RCEM exams, and structured WBA requirements.',
  },
  {
    name: 'Paediatrics',
    icon: Baby,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    description: 'ST1–ST8 paediatrics training with RCPCH ePortfolio guidance and MRCPCH exam tracking.',
  },
  {
    name: 'Psychiatry',
    icon: Brain,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'CT1–ST6 psychiatry training with MRCPsych exam progress and WBA tracking.',
  },
];

export default function SpecialtiesPage() {
  const { user } = useAuth();

  return (
    <div className="page-enter space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">
          Specialties
        </h1>
        <p className="text-surface-500 mt-1">
          Choose the training programmes you want to track. Each specialty comes with
          pre-built ARCP requirement checklists.
        </p>
      </div>

      {/* Available specialties */}
      <div>
        <h2 className="font-display font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Available now
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SPECIALTIES.map((spec) => {
            const details = SPECIALTY_DETAILS[spec.id];
            if (!details) return null;
            const Icon = details.icon;

            return (
              <div
                key={spec.id}
                className="card p-6 flex flex-col gap-4 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${details.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${details.color}`} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-surface-900">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-surface-400">{details.years}</p>
                  </div>
                </div>

                <p className="text-sm text-surface-600 leading-relaxed">
                  {details.description}
                </p>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                    Key requirements tracked
                  </p>
                  {details.keyRequirements.map((req, i) => (
                    <p key={i} className="text-xs text-surface-500 flex items-start gap-1.5">
                      <span className="text-brand-500 mt-0.5">•</span>
                      {req}
                    </p>
                  ))}
                </div>

                <Link
                  href={`/portfolio/${spec.id}`}
                  className="btn-primary mt-auto text-sm"
                >
                  {user ? 'Start tracking' : 'View requirements'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <h2 className="font-display font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Coming soon
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMING_SOON.map((spec) => {
            const Icon = spec.icon;
            return (
              <div
                key={spec.name}
                className="card p-5 opacity-75 flex gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${spec.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${spec.color}`} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-surface-800 text-sm">
                    {spec.name}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                    {spec.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-surface-400 mt-4">
          Want a specialty added? Let us know at{' '}
          <strong>[YOUR EMAIL]</strong> — we prioritise based on demand.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <strong>Disclaimer:</strong> ARCP requirement checklists are compiled from publicly
        available Royal College curricula and are for guidance only. Always verify your
        specific requirements with your Training Programme Director or Deanery.
      </div>
    </div>
  );
}
