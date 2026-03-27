'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Check, Loader2, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please email us directly at admin@medfolio.uk');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
          Get in touch
        </h1>
        <p className="text-surface-500 mb-8">
          Have a question, feature request, or found a bug? We&apos;d love to hear from you.
        </p>

        {submitted ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-surface-900 mb-2">
              Message sent!
            </h2>
            <p className="text-surface-500 text-sm mb-6">
              Thanks for reaching out. We&apos;ll get back to you as soon as possible.
            </p>
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@nhs.net"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field min-h-[150px] resize-y"
                placeholder="Tell us what's on your mind — feature requests, bug reports, or just say hello..."
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Send message'}
            </button>

            <p className="text-xs text-surface-400 text-center">
              Or email us directly at <strong>admin@medfolio.uk</strong>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
