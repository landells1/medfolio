import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://813ce5394f6055a1b7989b4d3c2a012a@o4511112833925120.ingest.de.sentry.io/4511112837333072',
  tracesSampleRate: 0.1,
  debug: false,
});
