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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ChecklistSetRow, UserChecklistSetRow } from '@/lib/database.types';

export function Sidebar() {
  const pathname = usePathname();
  const { profile, user, signOut } = useAuth();
  const [trainingOpen, setTrainingOpen] = useState(true);
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Active application sets for this user
  const [activeAppSets, setActiveAppSets] = useState<Array<{ id: string; specialty: string; name: string }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();

    const fetchAppSets = async () => {
      // Fetch user's activated application checklist sets
      const { data: userSets, error: userSetsError } = await supabase
        .from('user_checklist_sets')
        .select('checklist_set_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (userSetsError || !userSets || userSets.length === 0) {
        setActiveAppSets([]);
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
        return;
      }

      setActiveAppSets((sets as ChecklistSetRow[]).map((s) => ({ id: s.id, specialty: s.specialty, name: s.name })));
    };

    fetchAppSets();
  }, [user?.id]);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  const bottomItems = [
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Filter out specialties the user has hidden via Settings > Manage specialties.
  // Portfolio data is never deleted — hiding just removes it from the nav.
  const visibleSpecialties = SPECIALTIES.filter(
    (spec) => !(profile?.hidden_specialties ?? []).includes(spec.id)
  );

  // Map application specialty DB name to URL slug
  const getAppSlug = (dbSpecialty: string) => {
    const found = APPLICATION_SPECIALTIES.find((s) => s.name === dbSpecialty);
    return found?.id || dbSpecialty.toLowerCase();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <a href="/dashboard" className="px-5 h-16 flex items-center gap-2.5 border-b border-surface-800/50 flex-shrink-0 hover:bg-white/5 transition-colors">
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
              isActive(item.href)
                ? 'bg-white/10 text-white'
                : 'text-surface-400 hover:text-white hover:bg-white/5'
            )}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {item.label}
          </a>
        ))}

        {/* My Training section */}
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
                    isActive(`/training/${spec.id}`)
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

        {/* Future Applications section */}
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
              {activeAppSets.length > 0 ? (
                activeAppSets.map((set) => (
                  <a
                    key={set.id}
                    href={`/applications/${getAppSlug(set.specialty)}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150',
                      isActive(`/applications/${getAppSlug(set.specialty)}`)
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
            isActive('/specialties')
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
              isActive(item.href)
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
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(profile?.full_name || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-surface-500 truncate">
              {profile?.training_stage || 'Set your stage'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

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
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-surface-950 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
