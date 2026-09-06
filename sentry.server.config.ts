import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Operators are a small internal team; full traces are affordable and the
  // PRD's 99.9% uptime target is easier to defend with complete data.
  tracesSampleRate: 1,
  enabled: process.env.NODE_ENV === "production",
});
