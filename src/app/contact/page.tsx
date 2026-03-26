'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Check } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, open the user's email client with pre-filled content
    const subject = encodeURIComponent(`MedFolio Contact: ${name}`);
    const body = encodeURIComponent(`From: ${name} (${email})\n\n${message}`);
    window.open(`mailto:hello@medfolio.uk?subject=${subject}&body=${body}`, '_self');
    setSubmitted(true);
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
              Thanks for reaching out!
            </h2>
            <p className="text-surface-500 text-sm mb-6">
              Your email client should have opened with a pre-filled message.
              If it didn&apos;t, you can email us directly at{' '}
              <strong>hello@medfolio.uk</strong>
            </p>
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Dr Jane Smith"
                required
              />
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

            <button type="submit" className="btn-primary w-full !py-3">
              <Send className="w-4 h-4" />
              Send message
            </button>

            <p className="text-xs text-surface-400 text-center">
              Or email us directly at <strong>hello@medfolio.uk</strong>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
