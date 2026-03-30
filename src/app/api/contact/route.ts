import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function getRateLimitStore() {
  const globalScope = globalThis as typeof globalThis & {
    __medfolioContactRateLimit?: Map<string, number[]>;
  };

  if (!globalScope.__medfolioContactRateLimit) {
    globalScope.__medfolioContactRateLimit = new Map();
  }

  return globalScope.__medfolioContactRateLimit;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const store = getRateLimitStore();
    const now = Date.now();
    const recent = (store.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);

    if (recent.length >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    recent.push(now);
    store.set(ip, recent);

    const { firstName, lastName, email, message, company } = await req.json();

    if (company) {
      return NextResponse.json({ success: true });
    }

    const trimmedFirstName = String(firstName || '').trim();
    const trimmedLastName = String(lastName || '').trim();
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedMessage = String(message || '').trim();

    if (!trimmedFirstName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (trimmedFirstName.length > 80 || trimmedLastName.length > 80 || trimmedMessage.length > 5000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    }

    const safeFirstName = escapeHtml(trimmedFirstName);
    const safeLastName = escapeHtml(trimmedLastName);
    const safeEmail = escapeHtml(trimmedEmail);
    const safeMessage = escapeHtml(trimmedMessage);
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service is not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'MedFolio <admin@medfolio.uk>',
        to: 'admin@medfolio.uk',
        reply_to: trimmedEmail,
        subject: `MedFolio Feedback from ${trimmedFirstName} ${trimmedLastName}`.trim(),
        text: `From: ${trimmedFirstName} ${trimmedLastName} (${trimmedEmail})\n\n${trimmedMessage}`,
        html: `
          <p><strong>From:</strong> ${safeFirstName} ${safeLastName} (<a href="mailto:${safeEmail}">${safeEmail}</a>)</p>
          <hr />
          <p>${safeMessage.replace(/\n/g, '<br />')}</p>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('[MedFolio] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[MedFolio] Contact API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
