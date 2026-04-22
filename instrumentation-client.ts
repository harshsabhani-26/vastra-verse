// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// ─── Suppress known third-party console.error noise ──────────────────────────
// MSG91's otp-provider.js calls console.error("network-error") when hCaptcha's
// closeChallenge network request fails. Next.js dev tools intercept console.error
// and show a full-screen overlay for ANY console.error call — including this noise.
//
// We use Object.defineProperty so our filter survives HMR re-patches:
// when Next.js re-wraps console.error after a hot reload, our setter captures
// the new function as the passthrough target but console.error getter always
// returns our filter — third-party noise never reaches the dev overlay.
if (typeof window !== "undefined") {
  let _target = console.error.bind(console);

  const _filter = (...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (msg === "network-error" || /hcaptcha/i.test(msg)) return;
    _target(...args);
  };

  try {
    Object.defineProperty(console, "error", {
      get: () => _filter,
      set: (fn: (...args: unknown[]) => void) => {
        // Next.js HMR replaces console.error on hot reloads — capture the new
        // function as our passthrough so error reporting still works, but
        // third-party noise continues to be filtered.
        if (typeof fn === "function" && fn !== _filter) {
          _target = fn;
        }
      },
      configurable: true,
    });
  } catch {
    // Fallback: plain assignment if defineProperty fails (e.g. locked console)
    console.error = _filter;
  }
}


Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only run Sentry in production — prevents it from wrapping third-party
  // event handlers (sentryWrapped) in dev, which was causing hCaptcha/MSG91
  // errors to surface via console.error in the Next.js dev overlay.
  enabled: process.env.NODE_ENV === "production",

  integrations: [Sentry.replayIntegration()],

  // Sample 10% of transactions in production
  tracesSampleRate: 0.1,

  // Replay: off in normal sessions, capture on errors only
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,

  // Do NOT send PII (emails, IPs) to Sentry
  sendDefaultPii: false,

  // Filter out known noise before events leave the browser
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop",
    // User-initiated navigation aborts
    "AbortError",
    "Failed to fetch",
    "Load failed",
    // Next.js hydration warnings (surfaced by React DevTools, not real errors)
    "Hydration failed",
    "Text content does not match",
    // Third-party: MSG91 otp-provider.js + hCaptcha transient network failures
    "network-error",
    /hcaptcha/i,
  ],

  // Drop any error whose stack trace originates entirely from third-party scripts
  beforeSend(event) {
    const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
    const isThirdParty = frames.some(
      (f) =>
        f.filename?.includes("hcaptcha.com") ||
        f.filename?.includes("msg91.com") ||
        f.filename?.includes("otp-provider")
    );
    if (isThirdParty) return null;
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
