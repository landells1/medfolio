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
  BarChart3,
} from 'lucide-react';

type YearProgress = Record<string, { completed: number; total: number }>;
type SpecialtyProgress = Record<string, YearProgress>;
type RecentCase = Pick<CaseRow, 'id' | 'title' | 'specialty_tags' | 'date_seen'>;
type TemplateSummary = { id: string; specialty: string; training_year: string };
type PortfolioSummary = Pick<PortfolioItemRow, 'specialty' | 'status' | 'template_id'>;
type AnalyticsCase = Pick<CaseRow, 'date_seen' | 'specialty_tags' | 'complexity'>;

export default function DashboardPage() {
  const { profile, user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [stats, setStats] = useState({
    totalCases: 0,
    casesThisMonth: 0,
    portfolioProgress: {} as SpecialtyProgress,
  });
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [analytics, setAnalytics] = useState({
    casesBySpecialty: [] as { name: string; count: number }[],
    casesByComplexity: [] as { name: string; count: number }[],
    casesByMonth: [] as { month: string; count: number }[],
    portfolioCompletion: [] as { specialty: string; completed: number; total: number }[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    let baseDataLoaded = false;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [monthRes, recentRes, allCasesRes, portfolioRes, templatesRes] = await Promise.all([
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
          .from('cases')
          .select('date_seen, specialty_tags, complexity')
          .eq('user_id', userId)
          .limit(5000),
        supabase
          .from('portfolio_items')
          .select('specialty, status, template_id')
          .eq('user_id', userId),
        supabase
          .from('checklist_templates')
          .select('id, specialty, training_year'),
      ]);

      if (monthRes.error) throw monthRes.error;
      if (recentRes.error) throw recentRes.error;
      if (allCasesRes.error) throw allCasesRes.error;
      if (portfolioRes.error) throw portfolioRes.error;
      if (templatesRes.error) throw templatesRes.error;

      const templateRows: TemplateSummary[] = templatesRes.data ?? [];
      const allPortfolioItems: PortfolioSummary[] = portfolioRes.data ?? [];
      const recentCaseRows: RecentCase[] = recentRes.data ?? [];
      const allCases: AnalyticsCase[] = allCasesRes.data ?? [];

      // --- Portfolio progress rings ---
      const templateYearMap: Record<string, string> = {};
      for (const t of templateRows) {
        templateYearMap[t.id] = t.training_year;
      }

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
        if (Object.keys(yearMap).length > 0) progress[spec.id] = yearMap;
      }

      // --- Analytics ---
      const specMap: Record<string, number> = {};
      allCases.forEach((c) => {
        (c.specialty_tags || []).forEach((t: string) => {
          specMap[t] = (specMap[t] || 0) + 1;
        });
      });
      const casesBySpecialty = Object.entries(specMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const compMap: Record<string, number> = {};
      allCases.forEach((c) => {
        const comp = c.complexity || 'routine';
        compMap[comp] = (compMap[comp] || 0) + 1;
      });
      const casesByComplexity = Object.entries(compMap).map(([name, count]) => ({ name, count }));

      const monthMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        monthMap[key] = 0;
      }
      allCases.forEach((c) => {
        const d = new Date(c.date_seen);
        const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        if (key in monthMap) monthMap[key]++;
      });
      const casesByMonth = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

      const portfolioCompletion: { specialty: string; completed: number; total: number }[] = [];
      for (const spec of SPECIALTIES) {
        const specItems = allPortfolioItems.filter((i) => i.specialty === spec.name);
        if (specItems.length > 0) {
          portfolioCompletion.push({
            specialty: spec.name,
            completed: specItems.filter((i) => i.status === 'completed').length,
            total: specItems.length,
          });
        }
      }

      setStats({
        totalCases: allCases.length,
        casesThisMonth: monthRes.count || 0,
        portfolioProgress: progress,
      });
      setRecentCases(recentCaseRows);
      setAnalytics({ casesBySpecialty, casesByComplexity, casesByMonth, portfolioCompletion });
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

  // ⚠️ INFINITE LOADING BUG WARNING — do not change this pattern.
  //
  // Pages must wait for the auth context to settle (authLoading === false)
  // before making any Supabase calls. Do NOT call supabase.auth.getSession()
  // directly inside this component — it races the auth context's own
  // getSession() call on startup and can hang indefinitely, leaving the page
  // stuck on a spinner that only a manual refresh can clear.
  //
  // Safe pattern: read user.id from useAuth(), gate all fetches on
  // authLoading === false, pass userId in as a parameter.
  const userId = user?.id;
  useEffect(() => {
    if (authLoading || !userId) return;
    fetchData(userId);
  }, [authLoading, userId, fetchData]);

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
        <button onClick={() => userId && fetchData(userId)} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  const activeSpecialties = SPECIALTIES.filter((spec) => stats.portfolioProgress[spec.id]);
  const maxCaseCount = Math.max(...analytics.casesByMonth.map((m) => m.count), 1);

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
            <h2 className="font-display font-semibold text-surface-900">Training progress</h2>
          </div>

          {SPECIALTIES.length < 1 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 mb-4">No specialties set up yet</p>
              <Link href="/training/foundation" className="btn-primary text-sm">
                Set up your portfolio
              </Link>
            </div>
          ) : activeSpecialties.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 mb-4">No portfolio data yet</p>
              <Link href="/training/foundation" className="btn-primary text-sm">
                Start tracking
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {activeSpecialties.map((spec) => {
                const yearProgress = stats.portfolioProgress[spec.id];
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
                            href={`/training/${spec.id}`}
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

      {/* Analytics section */}
      {stats.totalCases === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-surface-700 mb-2">No analytics yet</h3>
          <p className="text-surface-500 text-sm">
            Start logging cases and tracking your portfolio to see analytics here.
          </p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="font-display text-lg font-bold text-surface-900">Analytics</h2>
            <p className="text-surface-500 text-sm mt-0.5">Visual overview of your training activity</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cases over time */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-surface-900 mb-4">Cases over time</h3>
              <div className="flex items-end gap-1.5 h-40">
                {analytics.casesByMonth.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-surface-500 font-mono">
                      {m.count > 0 ? m.count : ''}
                    </span>
                    <div
                      className="w-full rounded-t-sm bg-brand-400 transition-all duration-500"
                      style={{
                        height: `${Math.max((m.count / maxCaseCount) * 100, m.count > 0 ? 8 : 2)}%`,
                        backgroundColor: m.count > 0 ? undefined : '#e4e9ed',
                      }}
                    />
                    <span className="text-[9px] text-surface-400 -rotate-45 origin-center whitespace-nowrap">
                      {m.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cases by specialty */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-surface-900 mb-4">Cases by specialty</h3>
              <div className="space-y-3">
                {analytics.casesBySpecialty.length === 0 ? (
                  <p className="text-sm text-surface-400">No specialty data yet</p>
                ) : (
                  analytics.casesBySpecialty.map((s) => {
                    const maxSpec = analytics.casesBySpecialty[0]?.count || 1;
                    return (
                      <div key={s.name} className="flex items-center gap-3">
                        <span className="text-xs text-surface-600 w-28 truncate flex-shrink-0">
                          {s.name}
                        </span>
                        <div className="flex-1 h-5 rounded-full bg-surface-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-400 transition-all duration-500"
                            style={{ width: `${(s.count / maxSpec) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-surface-500 w-8 text-right">
                          {s.count}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Complexity breakdown */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-surface-900 mb-4">Case complexity</h3>
              <div className="flex gap-4">
                {['routine', 'moderate', 'complex', 'rare'].map((level) => {
                  const count = analytics.casesByComplexity.find((c) => c.name === level)?.count || 0;
                  const colors: Record<string, string> = {
                    routine: 'bg-surface-200 text-surface-600',
                    moderate: 'bg-brand-100 text-brand-700',
                    complex: 'bg-amber-100 text-amber-700',
                    rare: 'bg-purple-100 text-purple-700',
                  };
                  return (
                    <div key={level} className="flex-1 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold ${colors[level]}`}
                      >
                        {count}
                      </div>
                      <p className="text-xs text-surface-500 mt-1.5 capitalize">{level}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Portfolio completion */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-surface-900 mb-4">Portfolio completion</h3>
              {analytics.portfolioCompletion.length === 0 ? (
                <p className="text-sm text-surface-400">
                  Start tracking your portfolio to see completion data.
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.portfolioCompletion.map((p) => (
                    <div key={p.specialty}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-surface-700">{p.specialty}</span>
                        <span className="text-xs text-surface-500">
                          {p.completed}/{p.total} ({Math.round((p.completed / p.total) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${(p.completed / p.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
