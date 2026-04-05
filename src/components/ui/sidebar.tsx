'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn, getInitials, SPECIALTIES, APPLICATION_SPECIALTIES } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Compass,
  MessageSquarePlus,
  Target,
  GraduationCap,
} from 'lucide-react';
import { useState, useEffect, useLayoutEffect } from 'react';
import type { ChecklistSetRow, UserChecklistSetRow } from '@/lib/database.types';

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = { href: string; icon: React.ElementType; label: string };
type AppSet = { id: string; specialty: string; name: string };
type SpecialtyItem = (typeof SPECIALTIES)[number];

type SidebarContentProps = {
  pathname: string;
  navItems: NavItem[];
  bottomItems: NavItem[];
  trainingOpen: boolean;
  setTrainingOpen: (v: boolean) => void;
  applicationsOpen: boolean;
  setApplicationsOpen: (v: boolean) => void;
  visibleSpecialties: SpecialtyItem[];
  appSetsLoading: boolean;
  activeAppSets: AppSet[];
  setMobileOpen: (v: boolean) => void;
  // Resolved display values — parent handles loading/cache logic so this
  // component never needs to know about auth loading state.
  displayName: string;
  displayStage: string;
  showSkeleton: boolean;
  signOut: () => Promise<void>;
};

// ─── Helpers (stable references, defined outside components) ─────────────────

function getAppSlug(dbSpecialty: string) {
  const found = APPLICATION_SPECIALTIES.find((s) => s.name === dbSpecialty);
  return found?.id || dbSpecialty.toLowerCase();
}

function isActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

// ─── SidebarContent — defined at module level so React sees a stable type ────
// If defined inside Sidebar(), every re-render creates a new function reference,
// causing React to unmount + remount the entire subtree (triggering the flicker).

function SidebarContent({
  pathname,
  navItems,
  bottomItems,
  trainingOpen,
  setTrainingOpen,
  applicationsOpen,
  setApplicationsOpen,
  visibleSpecialties,
  appSetsLoading,
  activeAppSets,
  setMobileOpen,
  displayName,
  displayStage,
  showSkeleton,
  signOut,
}: SidebarContentProps) {

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <a
        href="/dashboard"
        className="px-5 h-16 flex items-center gap-2.5 border-b border-surface-800/50 flex-shrink-0 hover:bg-white/5 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <span className="font-display font-bold text-[15px] text-white">MedFolio</span>
      </a>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              isActive(item.href, pathname)
                ? 'bg-white/10 text-white'
                : 'text-surface-400 hover:text-white hover:bg-white/5'
            )}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {item.label}
          </a>
        ))}

        {/* Medical Student */}
        <a
          href="/medical-student"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            pathname.startsWith('/medical-student')
              ? 'bg-white/10 text-white'
              : 'text-surface-400 hover:text-white hover:bg-white/5'
          )}
        >
          <GraduationCap className="w-[18px] h-[18px] flex-shrink-0" />
          Medical Student
        </a>

        {/* My Training */}
        <div>
          <button
            onClick={() => setTrainingOpen(!trainingOpen)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 w-full',
              pathname.startsWith('/training') || pathname.startsWith('/portfolio')
                ? 'bg-white/10 text-white'
                : 'text-surface-400 hover:text-white hover:bg-white/5'
            )}
          >
            <ClipboardCheck className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="flex-1 text-left">My Training</span>
            {trainingOpen ? (
              <ChevronDown className="w-4 h-4 text-surface-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-surface-500" />
            )}
          </button>

          {trainingOpen && (
            <div className="ml-5 pl-4 border-l border-surface-800 mt-1 space-y-0.5">
              {visibleSpecialties.map((spec) => (
                <a
                  key={spec.id}
                  href={`/training/${spec.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150',
                    isActive(`/training/${spec.id}`, pathname)
                      ? 'text-brand-400 bg-brand-500/10'
                      : 'text-surface-500 hover:text-surface-300 hover:bg-white/5'
                  )}
                >
                  {spec.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Future Applications */}
        <div>
          <button
            onClick={() => setApplicationsOpen(!applicationsOpen)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 w-full',
              pathname.startsWith('/applications')
                ? 'bg-white/10 text-white'
                : 'text-surface-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Target className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="flex-1 text-left">Future Applications</span>
            {applicationsOpen ? (
              <ChevronDown className="w-4 h-4 text-surface-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-surface-500" />
            )}
          </button>

          {applicationsOpen && (
            <div className="ml-5 pl-4 border-l border-surface-800 mt-1 space-y-0.5">
              {appSetsLoading ? (
                <div className="px-3 py-1.5">
                  <div className="h-3 w-28 rounded bg-white/10 animate-pulse" />
                </div>
              ) : activeAppSets.length > 0 ? (
                activeAppSets.map((set) => (
                  <a
                    key={set.id}
                    href={`/applications/${getAppSlug(set.specialty)}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150',
                      isActive(`/applications/${getAppSlug(set.specialty)}`, pathname)
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-surface-500 hover:text-surface-300 hover:bg-white/5'
                    )}
                  >
                    {set.name}
                  </a>
                ))
              ) : (
                <a
                  href="/applications"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-surface-600 hover:text-surface-400 hover:bg-white/5 transition-all duration-150"
                >
                  Browse applications
                </a>
              )}
            </div>
          )}
        </div>

        <a
          href="/cases/new"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            pathname.startsWith('/cases')
              ? 'bg-white/10 text-white'
              : 'text-surface-400 hover:text-white hover:bg-white/5'
          )}
        >
          <BookOpen className="w-[18px] h-[18px] flex-shrink-0" />
          Case Journal
        </a>

        <a
          href="/specialties"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            isActive('/specialties', pathname)
              ? 'bg-white/10 text-white'
              : 'text-surface-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Compass className="w-[18px] h-[18px] flex-shrink-0" />
          All Specialties
        </a>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-surface-800/50 space-y-0.5 flex-shrink-0">
        {bottomItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              isActive(item.href, pathname)
                ? 'bg-white/10 text-white'
                : 'text-surface-400 hover:text-white hover:bg-white/5'
            )}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {item.label}
          </a>
        ))}

        <a
          href="/contact"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-400 hover:text-white hover:bg-white/5 transition-all duration-150 w-full"
        >
          <MessageSquarePlus className="w-[18px] h-[18px] flex-shrink-0" />
          Send feedback
        </a>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 w-full"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          Log out
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-white/5">
          {showSkeleton ? (
            <>
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-white/10 animate-pulse" />
              </div>
            </>
          ) : (
            <>
              {/* suppressHydrationWarning: server renders '' (no window),
                  client renders from localStorage — intentional mismatch */}
              <div
                suppressHydrationWarning
                className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              >
                {displayName ? getInitials(displayName) : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p suppressHydrationWarning className="text-sm font-medium text-white truncate">
                  {displayName || (
                    <span className="text-surface-500 italic text-xs">Set your name</span>
                  )}
                </p>
                <p suppressHydrationWarning className="text-xs text-surface-500 truncate">
                  {displayStage || 'Set your stage'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar — only manages state and layout shell ───────────────────────────

const CACHE_NAME_KEY = 'mf_display_name';
const CACHE_STAGE_KEY = 'mf_training_stage';

function readCache(key: string): string {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}
function writeCache(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}
function clearCache() {
  try { localStorage.removeItem(CACHE_NAME_KEY); localStorage.removeItem(CACHE_STAGE_KEY); } catch {}
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile, user, loading: authLoading, signOut } = useAuth();
  const [trainingOpen, setTrainingOpen] = useState(true);
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAppSets, setActiveAppSets] = useState<AppSet[]>([]);
  const [appSetsLoading, setAppSetsLoading] = useState(true);

  // ── Display name / stage with localStorage cache ──────────────────────────
  // useState initializers run on the server during SSR and return '' (no window).
  // React does NOT re-run them during client hydration — it reuses server state.
  // useLayoutEffect fires on the client BEFORE the browser paints, so the cached
  // name is in place before the user ever sees the React-rendered content.
  const [cachedName, setCachedName] = useState('');
  const [cachedStage, setCachedStage] = useState('');

  useLayoutEffect(() => {
    setCachedName(readCache(CACHE_NAME_KEY));
    setCachedStage(readCache(CACHE_STAGE_KEY));
  }, []);

  // Write to cache when profile resolves; clear when signed out.
  useEffect(() => {
    if (!authLoading && !user) {
      clearCache();
      setCachedName('');
      setCachedStage('');
      return;
    }
    if (profile) {
      const name = profile.full_name || (user?.user_metadata?.full_name as string) || '';
      const stage = profile.training_stage || '';
      writeCache(CACHE_NAME_KEY, name);
      writeCache(CACHE_STAGE_KEY, stage);
      setCachedName(name);
      setCachedStage(stage);
    }
  }, [profile, user, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setActiveAppSets([]);
      setAppSetsLoading(false);
      return;
    }
    const supabase = createClient();

    const fetchAppSets = async () => {
      setAppSetsLoading(true);
      const { data: userSets, error: userSetsError } = await supabase
        .from('user_checklist_sets')
        .select('checklist_set_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (userSetsError || !userSets || userSets.length === 0) {
        setActiveAppSets([]);
        setAppSetsLoading(false);
        return;
      }

      const setIds = (userSets as UserChecklistSetRow[]).map((s) => s.checklist_set_id);
      const { data: sets, error: setsError } = await supabase
        .from('checklist_sets')
        .select('id, specialty, name')
        .eq('kind', 'application')
        .in('id', setIds);

      if (setsError || !sets) {
        setActiveAppSets([]);
        setAppSetsLoading(false);
        return;
      }

      setActiveAppSets(
        (sets as ChecklistSetRow[]).map((s) => ({ id: s.id, specialty: s.specialty, name: s.name }))
      );
      setAppSetsLoading(false);
    };

    void fetchAppSets();
  }, [user?.id, pathname, authLoading]);

  const navItems: NavItem[] = [{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }];
  const bottomItems: NavItem[] = [{ href: '/settings', icon: Settings, label: 'Settings' }];

  const visibleSpecialties = SPECIALTIES.filter(
    (spec) => !(profile?.hidden_specialties ?? []).includes(spec.id)
  );

  // Resolved display values: prefer live profile, fall back to cache so the
  // name is always visible without waiting for auth to complete.
  const resolvedName = profile?.full_name || (user?.user_metadata?.full_name as string) || cachedName;
  const resolvedStage = profile?.training_stage || cachedStage;
  // Only show skeleton when truly loading AND there is no cached value to show.
  const showSkeleton = (authLoading || (!!user && !profile)) && !resolvedName;

  const contentProps: SidebarContentProps = {
    pathname,
    navItems,
    bottomItems,
    trainingOpen,
    setTrainingOpen,
    applicationsOpen,
    setApplicationsOpen,
    visibleSpecialties,
    appSetsLoading,
    activeAppSets,
    setMobileOpen,
    displayName: resolvedName,
    displayStage: resolvedStage,
    showSkeleton,
    signOut,
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-900 text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface-950 transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-surface-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent {...contentProps} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-surface-950 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent {...contentProps} />
      </aside>
    </>
  );
}
