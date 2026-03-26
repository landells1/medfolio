import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: 'https://813ce5394f6055a1b7989b4d3c2a012a@o4511112833925120.ingest.de.sentry.io/4511112837333072',
      tracesSampleRate: 0.1,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: 'https://813ce5394f6055a1b7989b4d3c2a012a@o4511112833925120.ingest.de.sentry.io/4511112837333072',
      tracesSampleRate: 0.1,
      debug: false,
    });
  }
}
