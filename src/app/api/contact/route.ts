import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, message } = await req.json();

    if (!firstName || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MedFolio <admin@medfolio.uk>',
        to: 'admin@medfolio.uk',
        reply_to: email,
        subject: `MedFolio Feedback from ${firstName} ${lastName}`.trim(),
        text: `From: ${firstName} ${lastName} (${email})\n\n${message}`,
        html: `
          <p><strong>From:</strong> ${firstName} ${lastName} (<a href="mailto:${email}">${email}</a>)</p>
          <hr />
          <p>${message.replace(/\n/g, '<br />')}</p>
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
