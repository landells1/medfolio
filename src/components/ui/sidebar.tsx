'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn, getInitials, SPECIALTIES } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Compass,
  MessageSquarePlus,

} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [portfolioOpen, setPortfolioOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  const bottomItems = [
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/dashboard" className="px-5 h-16 flex items-center gap-2.5 border-b border-surface-800/50 flex-shrink-0 hover:bg-white/5 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <span className="font-display font-bold text-[15px] text-white">MedFolio</span>
      </Link>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <Link
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
          </Link>
        ))}

        {/* Portfolio section with sub-nav */}
        <div>
          <button
            onClick={() => setPortfolioOpen(!portfolioOpen)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 w-full',
              pathname.startsWith('/portfolio')
                ? 'bg-white/10 text-white'
                : 'text-surface-400 hover:text-white hover:bg-white/5'
            )}
          >
            <ClipboardCheck className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="flex-1 text-left">Portfolio</span>
            {portfolioOpen ? (
              <ChevronDown className="w-4 h-4 text-surface-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-surface-500" />
            )}
          </button>

          {portfolioOpen && (
            <div className="ml-5 pl-4 border-l border-surface-800 mt-1 space-y-0.5">
              {SPECIALTIES.map((spec) => (
                <Link
                  key={spec.id}
                  href={`/portfolio/${spec.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150',
                    isActive(`/portfolio/${spec.id}`)
                      ? 'text-brand-400 bg-brand-500/10'
                      : 'text-surface-500 hover:text-surface-300 hover:bg-white/5'
                  )}
                >
                  {spec.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
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
        </Link>

        <Link
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
        </Link>

        <Link
          href="/analytics"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            isActive('/analytics')
              ? 'bg-white/10 text-white'
              : 'text-surface-400 hover:text-white hover:bg-white/5'
          )}
        >
          <BarChart3 className="w-[18px] h-[18px] flex-shrink-0" />
          Analytics
        </Link>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-surface-800/50 space-y-0.5 flex-shrink-0">
        {bottomItems.map((item) => (
          <Link
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
          </Link>
        ))}
        <Link
          href="/contact"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-400 hover:text-white hover:bg-white/5 transition-all duration-150 w-full"
        >
          <MessageSquarePlus className="w-[18px] h-[18px] flex-shrink-0" />
          Send feedback
        </Link>
        
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
