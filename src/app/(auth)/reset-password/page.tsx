'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {sent ? (
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">Check your email</h1>
            <p className="text-surface-500">
              If an account exists for <strong className="text-surface-700">{email}</strong>,
              you&apos;ll receive a password reset link shortly.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-surface-900 mb-1">Reset your password</h1>
            <p className="text-surface-500 mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@nhs.net"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
