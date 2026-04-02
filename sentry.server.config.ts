// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,  // audit: use env var instead of hardcoded DSN

  // Performance Monitoring — 10% sample rate (audit: was 1.0 = 100%, very expensive)
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // audit: disabled — prevents user emails/IPs from being sent to Sentry (PII)
  sendDefaultPii: false,

  // Only run in production
  enabled: process.env.NODE_ENV === "production",

  // Environment tag for filtering in Sentry dashboard
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
});
