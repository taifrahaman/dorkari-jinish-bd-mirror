// src/app/global-error.tsx

"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary.
 *
 * Only rendered when `src/app/layout.tsx` itself throws. Because that
 * layout failed, none of its dependencies loaded:
 *
 *   - No globals.css → no Tailwind, no CSS vars
 *   - No next/font → the brand fonts are absent
 *   - No <html> element → we render our own below
 *
 * So this file is intentionally self-contained: a <style> block, system
 * fonts, brand colours hardcoded. No imports beyond React itself.
 * Locale is unknown here, so both languages are shown together.
 */

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Nirmala UI", "Noto Sans Bengali", sans-serif';

const CSS = `
.ge-body {
  margin: 0;
  background: #faf8f5;
  color: #0f172a;
  font-family: ${FONT_STACK};
  -webkit-font-smoothing: antialiased;
}

.ge-root {
  --rgb: 239, 98, 72;
  --lw: 96px;
  --pt: 40px;
  --glow: min(150vw, 900px);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  min-height: 100svh;
  box-sizing: border-box;
  padding: var(--pt) 20px 56px;
  text-align: center;
  background: linear-gradient(180deg, #fffaf0 0%, #faf8f5 100%);
}
@media (min-width: 1024px) {
  .ge-root {
    --lw: 116px;
    --pt: 56px;
    padding-left: 48px;
    padding-right: 48px;
  }
}

/* ---------- glow behind the bulb ---------- */
.ge-glow {
  position: absolute;
  z-index: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: var(--glow);
  height: var(--glow);
  top: calc(var(--pt) + var(--lw) * 1.067 - var(--glow) / 2);
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    rgba(var(--rgb), 0.5) 0%,
    rgba(var(--rgb), 0.3) 14%,
    rgba(var(--rgb), 0.15) 28%,
    rgba(var(--rgb), 0.06) 42%,
    rgba(var(--rgb), 0.02) 54%,
    rgba(var(--rgb), 0) 64%
  );
  animation: ge-flicker 5s linear infinite;
}

/* ---------- lamp ---------- */
.ge-lamp {
  position: relative;
  z-index: 1;
  width: var(--lw);
  color: #0f172a;
  transform-origin: 50% 0;
  animation: ge-sway 3.4s ease-in-out infinite alternate;
}
.ge-lamp svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.ge-stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ge-shade { fill: #f1f5f9; }
.ge-shade-on {
  fill: rgba(var(--rgb), 0.28);
  animation: ge-flicker 5s linear infinite;
}
.ge-bulb-off { fill: #cbd5e1; }
.ge-bulb-on {
  fill: rgb(var(--rgb));
  filter: drop-shadow(0 0 10px rgba(var(--rgb), 0.9));
  animation: ge-flicker 5s linear infinite;
}

/* ---------- content ---------- */
.ge-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560px;
}

.ge-numeral {
  margin: 4px 0 0;
  font-size: clamp(5rem, 22vw, 9.5rem);
  font-weight: 300;
  line-height: 0.95;
  letter-spacing: -0.05em;
  background: linear-gradient(180deg, #0f172a 15%, transparent 95%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-user-select: none;
  user-select: none;
}

.ge-eyebrow {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #3c6f67;
}

.ge-title {
  margin: 12px 0 0;
  font-size: clamp(2rem, 6vw, 2.75rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.ge-p {
  margin: 14px 0 0;
  max-width: 28rem;
  font-size: 16px;
  line-height: 1.6;
  color: #334155;
}
.ge-p-bn {
  margin: 6px 0 0;
  max-width: 28rem;
  font-size: 15px;
  line-height: 1.75;
  color: #475569;
}

.ge-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 0;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 24px -14px rgba(15, 23, 42, 0.28);
  font-size: 12px;
  color: #334155;
}
.ge-chip code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #0f172a;
}

.ge-dev {
  box-sizing: border-box;
  width: 100%;
  max-height: 200px;
  margin: 20px 0 0;
  padding: 14px;
  overflow: auto;
  border-radius: 16px;
  border: 1px solid rgba(220, 38, 38, 0.25);
  background: #fef2f2;
  color: #b91c1c;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ---------- buttons ---------- */
.ge-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

.ge-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 48px;
  padding: 0 26px;
  border-radius: 999px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.ge-btn:active { transform: scale(0.95); }
.ge-btn:focus-visible {
  outline: 2px solid #fba705;
  outline-offset: 3px;
}

.ge-btn-primary {
  border: 0;
  background: #172642;
  color: #ffffff;
}
.ge-btn-primary:hover { background: #0f1a2e; }

.ge-btn-ghost {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 24px -14px rgba(15, 23, 42, 0.28);
  color: #0f172a;
}
.ge-btn-ghost:hover { background: rgba(251, 167, 5, 0.3); }

@media (max-width: 480px) {
  .ge-actions { flex-direction: column; width: 100%; max-width: 320px; }
}

/* ---------- motion ---------- */
@keyframes ge-flicker {
  0%, 19%, 23%, 54%, 58%, 100% { opacity: 0.2; }
  20%, 22% { opacity: 1; }
  21% { opacity: 0.3; }
  55%, 57% { opacity: 0.85; }
  56% { opacity: 0.25; }
}
@keyframes ge-sway {
  from { transform: rotate(-1.8deg); }
  to { transform: rotate(1.8deg); }
}
@media (prefers-reduced-motion: reduce) {
  .ge-glow, .ge-shade-on, .ge-bulb-on { animation: none; opacity: 0.6; }
  .ge-lamp { animation: none; }
  .ge-btn { transition: none; }
}
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry / logging service hook would go here. For now, log to console.
    console.error("[global-error]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong | কিছু একটা ভুল হয়েছে</title>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>

      <body className="ge-body">
        <main className="ge-root">
          <div className="ge-glow" aria-hidden="true" />

          <div className="ge-lamp" aria-hidden="true">
            <svg viewBox="0 0 120 190" focusable="false">
              <line x1="60" y1="0" x2="60" y2="62" className="ge-stroke" />
              <rect
                x="54"
                y="58"
                width="12"
                height="12"
                rx="3"
                className="ge-stroke"
              />
              <path
                d="M26 122 C26 86 44 70 60 70 C76 70 94 86 94 122 Z"
                className="ge-stroke ge-shade"
              />
              <path
                d="M26 122 C26 86 44 70 60 70 C76 70 94 86 94 122 Z"
                className="ge-shade-on"
              />
              <circle cx="60" cy="128" r="9" className="ge-bulb-off" />
              <circle cx="60" cy="128" r="9" className="ge-bulb-on" />
            </svg>
          </div>

          <div className="ge-content">
            <p className="ge-numeral" aria-hidden="true">
              Oops
            </p>

            <p className="ge-eyebrow">Something broke</p>

            <h1 className="ge-title">Something went wrong</h1>

            <div role="alert">
              <p className="ge-p">
                We hit an unexpected error. It&apos;s not you, it&apos;s us.
                Please try again.
              </p>
              <p className="ge-p-bn" lang="bn">
                একটি অপ্রত্যাশিত ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
              </p>
            </div>

            {error.digest && (
              <p className="ge-chip">
                <span>Error ID · রেফারেন্স</span>
                <code>{error.digest}</code>
              </p>
            )}

            {isDev && error.message && (
              <pre className="ge-dev">
                {error.message}
                {error.stack ? `\n\n${error.stack}` : ""}
              </pre>
            )}

            <div className="ge-actions">
              <button
                type="button"
                onClick={() => reset()}
                className="ge-btn ge-btn-primary"
              >
                Try again · আবার চেষ্টা করুন
              </button>

              {/* plain link: a full page load is the safest exit when the
                  root layout (and so the client router) may be broken */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="ge-btn ge-btn-ghost">
                Go to home · হোমে যান
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
