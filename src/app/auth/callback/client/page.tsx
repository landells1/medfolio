'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'loading' | 'recovery' | 'error';

function getSafeNext(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard';
  }

  return next;
}

function AuthCallbackClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('loading');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = useMemo(() => getSafeNext(searchParams.get('next')), [searchParams]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (type === 'recovery' && (event === 'PASSWORD_RECOVERY' || !!session)) {
        setMode('recovery');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, type]);

  useEffect(() => {
    const resolveAuth = async () => {
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        if (type === 'recovery') {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            setMode('error');
            setError('Recovery link is invalid or has expired.');
            return;
          }

          setMode('recovery');
          return;
        }

        router.replace(next);
      } catch (err) {
        console.error('[MedFolio] Auth callback error:', err);
        setMode('error');
        setError('Authentication link is invalid or has expired.');
      }
    };

    void resolveAuth();
  }, [code, next, router, supabase, type]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSavingPassword(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace('/dashboard');
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <p className="text-sm text-surface-500">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">Link invalid</h1>
          <p className="text-surface-500">{error}</p>
          <a href="/login" className="btn-primary mt-6 inline-flex">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card p-6 sm:p-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-brand-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">
          Set a new password
        </h1>
        <p className="text-surface-500 mb-6">
          Choose a new password for your MedFolio account.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              minLength={8}
              required
            />
          </div>

          <button type="submit" disabled={savingPassword} className="btn-primary w-full">
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save new password
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthCallbackClientPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <p className="text-sm text-surface-500">Completing sign-in...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackClientContent />
    </Suspense>
  );
}
