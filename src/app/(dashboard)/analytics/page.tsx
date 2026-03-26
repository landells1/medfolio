'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SPECIALTIES } from '@/lib/utils';
import { BarChart3, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCases: 0,
    casesBySpecialty: [] as { name: string; count: number }[],
    casesByComplexity: [] as { name: string; count: number }[],
    casesByMonth: [] as { month: string; count: number }[],
    portfolioCompletion: [] as { specialty: string; completed: number; total: number }[],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not signed in. Please log in and try again.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Fetch cases and all portfolio items in parallel (single query each)
      const [casesRes, portfolioRes] = await Promise.all([
        supabase.from('cases').select('*').eq('user_id', userId),
        supabase.from('portfolio_items').select('specialty, status').eq('user_id', userId),
      ]);

      const allCases = casesRes.data || [];

      // Cases by specialty tag
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

      // Cases by complexity
      const compMap: Record<string, number> = {};
      allCases.forEach((c) => {
        const comp = c.complexity || 'routine';
        compMap[comp] = (compMap[comp] || 0) + 1;
      });
      const casesByComplexity = Object.entries(compMap).map(([name, count]) => ({ name, count }));

      // Cases by month (last 12 months)
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

      // Portfolio completion from single query result
      const allPortfolioItems = portfolioRes.data || [];
      const portfolioCompletion = [];
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
        casesBySpecialty,
        casesByComplexity,
        casesByMonth,
        portfolioCompletion,
      });
    } catch (err) {
      console.error('[MedFolio] Analytics load error:', err);
      setError('Failed to load analytics. Please try again.');
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <p className="text-sm text-surface-500">Loading analytics...</p>
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

  const maxCaseCount = Math.max(...stats.casesByMonth.map((m) => m.count), 1);

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Analytics</h1>
        <p className="text-surface-500 mt-1">Visual overview of your training progress</p>
      </div>

      {stats.totalCases === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-surface-700 mb-2">No data yet</h3>
          <p className="text-surface-500 text-sm">
            Start logging cases and tracking your portfolio to see analytics here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cases over time */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-surface-900 mb-4">Cases over time</h2>
            <div className="flex items-end gap-1.5 h-40">
              {stats.casesByMonth.map((m) => (
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
            <h2 className="font-display font-semibold text-surface-900 mb-4">Cases by specialty</h2>
            <div className="space-y-3">
              {stats.casesBySpecialty.length === 0 ? (
                <p className="text-sm text-surface-400">No specialty data yet</p>
              ) : (
                stats.casesBySpecialty.map((s) => {
                  const maxSpec = stats.casesBySpecialty[0]?.count || 1;
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
            <h2 className="font-display font-semibold text-surface-900 mb-4">Case complexity</h2>
            <div className="flex gap-4">
              {['routine', 'moderate', 'complex', 'rare'].map((level) => {
                const count = stats.casesByComplexity.find((c) => c.name === level)?.count || 0;
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
            <h2 className="font-display font-semibold text-surface-900 mb-4">Portfolio completion</h2>
            {stats.portfolioCompletion.length === 0 ? (
              <p className="text-sm text-surface-400">
                Start tracking your portfolio to see completion data.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.portfolioCompletion.map((p) => (
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
      )}
    </div>
  );
}
