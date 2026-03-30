'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { ProgressRing } from '@/components/ui/progress';
import { SPECIALTIES, formatDate } from '@/lib/utils';
import type { CaseRow, PortfolioItemRow } from '@/lib/database.types';
import {
  Plus,
  BookOpen,
  ClipboardCheck,
  ArrowRight,
  Stethoscope,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

type YearProgress = Record<string, { completed: number; total: number }>;
type SpecialtyProgress = Record<string, YearProgress>;
type RecentCase = Pick<CaseRow, 'id' | 'title' | 'specialty_tags' | 'date_seen'>;
type TemplateSummary = { id: string; specialty: string; training_year: string };
type PortfolioSummary = Pick<PortfolioItemRow, 'specialty' | 'status' | 'template_id'>;

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalCases: 0,
    casesThisMonth: 0,
    portfolioProgress: {} as SpecialtyProgress,
  });
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let baseDataLoaded = false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not signed in. Please log in and try again.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [totalRes, monthRes, recentRes, portfolioRes, templatesRes] = await Promise.all([
        supabase
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('cases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('cases')
          .select('id, title, specialty_tags, date_seen')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('portfolio_items')
          .select('specialty, status, template_id')
          .eq('user_id', userId),
        supabase
          .from('checklist_templates')
          .select('id, specialty, training_year'),
      ]);

      if (totalRes.error) throw totalRes.error;
      if (monthRes.error) throw monthRes.error;
      if (recentRes.error) throw recentRes.error;
      if (portfolioRes.error) throw portfolioRes.error;
      if (templatesRes.error) throw templatesRes.error;

      const templateRows: TemplateSummary[] = templatesRes.data ?? [];
      const allPortfolioItems: PortfolioSummary[] = portfolioRes.data ?? [];
      const recentCaseRows: RecentCase[] = recentRes.data ?? [];

      // Build a lookup: template_id -> training_year
      const templateYearMap: Record<string, string> = {};
      for (const t of templateRows) {
        templateYearMap[t.id] = t.training_year;
      }

      // Build progress: spec.id -> training_year -> { completed, total }
      const progress: SpecialtyProgress = {};

      for (const spec of SPECIALTIES) {
        const specItems = allPortfolioItems.filter((i) => i.specialty === spec.name);
        if (specItems.length === 0) continue;

        const yearMap: YearProgress = {};
        for (const item of specItems) {
          const year = item.template_id ? templateYearMap[item.template_id] : undefined;
          if (!year) continue;
          if (!yearMap[year]) yearMap[year] = { completed: 0, total: 0 };
          yearMap[year].total++;
          if (item.status === 'completed') yearMap[year].completed++;
        }

        if (Object.keys(yearMap).length > 0) {
          progress[spec.id] = yearMap;
        }
      }

      setStats({
        totalCases: totalRes.count || 0,
        casesThisMonth: monthRes.count || 0,
        portfolioProgress: progress,
      });
      setRecentCases(recentCaseRows);
      baseDataLoaded = true;
    } catch (err) {
      console.error('[MedFolio] Dashboard load error:', err);
      if (!baseDataLoaded) {
        setError('Failed to load dashboard. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <p className="text-sm text-surface-500">Loading dashboard...</p>
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
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  const activeSpecialties = SPECIALTIES.filter((spec) => stats.portfolioProgress[spec.id]);

  return (
    <div className="page-enter space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">
          Good {getTimeOfDay()}, {firstName}
        </h1>
        <p className="text-surface-500 mt-1">
          Here&apos;s an overview of your training progress.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-brand-600" />
            </div>
          </div>
          <p className="font-display text-2xl font-bold text-surface-900">{stats.totalCases}</p>
          <p className="text-sm text-surface-500">Cases logged</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
          <p className="font-display text-2xl font-bold text-surface-900">{stats.casesThisMonth}</p>
          <p className="text-sm text-surface-500">Cases this month</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <ClipboardCheck className="w-4.5 h-4.5 text-amber-600" />
            </div>
          </div>
          <p className="font-display text-2xl font-bold text-surface-900">
            {activeSpecialties.length}
          </p>
          <p className="text-sm text-surface-500">Active specialties</p>
        </div>

        <Link href="/cases/new" className="card-hover p-5 group cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center group-hover:bg-brand-600 transition-colors">
              <Plus className="w-4.5 h-4.5 text-white" />
            </div>
          </div>
          <p className="font-display text-sm font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">
            Log a new case
          </p>
          <p className="text-sm text-surface-500">Quick capture →</p>
        </Link>
      </div>

      {/* Portfolio progress + Recent cases */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Portfolio progress */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-surface-900">Portfolio progress</h2>
          </div>

          {SPECIALTIES.length < 1 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 mb-4">No specialties set up yet</p>
              <Link href="/portfolio/foundation" className="btn-primary text-sm">
                Set up your portfolio
              </Link>
            </div>
          ) : activeSpecialties.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 mb-4">No portfolio data yet</p>
              <Link href="/portfolio/foundation" className="btn-primary text-sm">
                Start tracking
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {activeSpecialties.map((spec) => {
                const yearProgress = stats.portfolioProgress[spec.id];
                // Sort years in the order they appear in spec.years
                const sortedYears = spec.years.filter((y) => yearProgress[y]);

                return (
                  <div key={spec.id}>
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">
                      {spec.name}
                    </p>
                    <div className="flex flex-wrap gap-5">
                      {sortedYears.map((year) => {
                        const p = yearProgress[year];
                        const percentage = Math.round((p.completed / p.total) * 100);
                        return (
                          <Link
                            key={year}
                            href={`/portfolio/${spec.id}`}
                            className="group flex flex-col items-center gap-1.5"
                          >
                            <ProgressRing
                              value={percentage}
                              size={84}
                              strokeWidth={6}
                              label={year}
                              sublabel={`${p.completed}/${p.total}`}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent cases */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-surface-900">Recent cases</h2>
            <Link
              href="/cases/new"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCases.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-surface-300 mx-auto mb-2" />
              <p className="text-sm text-surface-500 mb-3">No cases logged yet</p>
              <Link href="/cases/new" className="btn-primary text-sm">
                <Plus className="w-4 h-4" />
                Log your first case
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="block p-3 rounded-lg hover:bg-surface-50 transition-colors -mx-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {c.specialty_tags?.[0] && (
                          <span className="badge-brand text-[10px]">
                            {c.specialty_tags[0]}
                          </span>
                        )}
                        <span className="text-xs text-surface-400">
                          {formatDate(c.date_seen)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
